import { ENDPOINTS } from "@/config/endpoints";
import { api, ApiError, downloadJob, runJob, uploadMedia, type Job, type PageEnvelope } from "@/shared/lib/api";
import { money, toReview, type ReviewDto } from "@/modules/products/services/products.mapper";
import type { Product, Review } from "@/modules/products/types";
import type { AdminProductListParams, AdminProductPage, BulkAction, ImageSlotValue, ProductFormValues, ProductStats, StockAdjustInput, StockMovement, VariantRow } from "../types";
import {
  toAdminProduct,
  toAdminStats,
  toProductPayload,
  toStockMovement,
  type AdminProductDetailDto,
  type AdminProductRowDto,
  type AdminStatsDto,
  type StockMovementDto,
} from "./admin-products.mapper";

const { products, variants, sales, reviews } = ENDPOINTS.admin;

/** Résumé d'un import (simulation ou réel), produit par la tâche asynchrone. */
export interface ImportSummary {
  created: number;
  updated: number;
  rows: number;
  dryRun: boolean;
  errorCount: number;
  errors: { row: number; errors: Record<string, string> }[];
}

const BULK_ACTION: Record<BulkAction["type"], string> = {
  activate: "activate",
  deactivate: "deactivate",
  trash: "trash",
  restore: "restore",
  category: "set_category",
  discount: "set_discount",
};

/**
 * Images à envoyer : `undefined` si la galerie n'a pas changé. L'API remplace toute la galerie (`image_ids`)
 * et ne renvoie pas les ids des images existantes : on ne peut donc pas en conserver une partie.
 */
async function imageIds(images: ImageSlotValue[], current: string[]): Promise<number[] | undefined> {
  const kept = images.filter((s) => s.url && !s.file).map((s) => s.url as string);
  const files = images.flatMap((s) => (s.file ? [s.file] : []));
  const unchanged = !files.length && kept.length === current.length && kept.every((url, i) => url === current[i]);
  if (current.length && unchanged) return undefined;
  if (kept.length) {
    throw new ApiError(400, "Pour modifier les photos, remplacez toutes les images du produit.", { errors: { image: ["Remplacez toutes les images (les images existantes ne peuvent pas être conservées partiellement)."] } });
  }
  const uploaded = [];
  for (const file of files) uploaded.push(await uploadMedia(file, "product_image"));
  return uploaded.map((m) => m.id);
}

const rowChanged = (row: VariantRow, before: Product["variants"][number]) =>
  JSON.stringify(row.attributes) !== JSON.stringify(before.attributes) || (row.sku || "") !== (before.sku ?? "") || (row.price === "" ? null : Number(row.price)) !== before.price;

/** Aligne les variantes du serveur sur celles du formulaire (création, modification, stock, suppression). */
async function syncVariants(productId: number, rows: VariantRow[], before: Product["variants"]) {
  const known = new Map(before.map((v) => [v.id, v]));
  for (const row of rows) {
    const old = known.get(row.id);
    const price = row.price === "" ? null : row.price;
    if (!old) {
      await api.post(products.variants(productId), { attributes: row.attributes, sku: row.sku || null, price, stock: Number(row.stock) });
      continue;
    }
    if (rowChanged(row, old)) await api.patch(variants.detail(row.id), { attributes: row.attributes, sku: row.sku, price });
    if (Number(row.stock) !== old.stock) {
      await api.post(products.stockAdjustments(productId), { mode: "set", value: Number(row.stock), reason: "correction", variantId: row.id });
    }
  }
  const remaining = new Set(rows.map((r) => r.id));
  for (const v of before) if (!remaining.has(v.id)) await api.delete(variants.detail(v.id));
}

export const adminProductsService = {
  async list(params: AdminProductListParams = {}): Promise<AdminProductPage> {
    const { category, status, ...rest } = params;
    const page = await api.page<AdminProductRowDto, Product>(
      products.list,
      { params: { ...rest, categoryId: category ?? undefined, status: status === "trash" ? "trash" : "all" } },
      toAdminProduct,
    );
    const stats = page.meta?.stats as AdminStatsDto | undefined;
    return { ...page, stats: stats ? toAdminStats(stats) : undefined };
  },

  async detail(id: number): Promise<Product> {
    return toAdminProduct(await api.get<AdminProductDetailDto>(products.detail(id)));
  },

  async save(id: number | null, values: ProductFormValues, images: ImageSlotValue[]): Promise<Product> {
    const before = id ? await adminProductsService.detail(id) : null;
    const ids = await imageIds(images, before?.images ?? []);
    const body = { ...toProductPayload(values), ...(ids ? { imageIds: ids } : {}) };
    const simple = !values.variants.length;
    const saved = before
      ? await api.patch<AdminProductDetailDto>(products.detail(before.id), body)
      : await api.post<AdminProductDetailDto>(products.list, { ...body, stock: simple ? Number(values.stock) : 0 });
    if (before && simple && !before.variants.length && Number(values.stock) !== before.stock) {
      await api.post(products.stockAdjustments(saved.id), { mode: "set", value: Number(values.stock), reason: "correction", note: "Modification depuis la fiche produit" });
    }
    if (values.variants.length || before?.variants.length) await syncVariants(saved.id, values.variants, before?.variants ?? []);
    return adminProductsService.detail(saved.id);
  },

  async duplicate(id: number): Promise<Product> {
    return toAdminProduct(await api.post<AdminProductDetailDto>(products.duplicate(id)));
  },

  /** Suppression DOUCE → corbeille. */
  async trash(ids: number[]): Promise<void> {
    await api.post(products.bulk, { ids, action: "trash" });
  },

  async restore(ids: number[]): Promise<void> {
    await api.post(products.bulk, { ids, action: "restore" });
  },

  async bulk(ids: number[], action: BulkAction): Promise<{ updated: number }> {
    const extra = action.type === "category" ? { categoryId: action.categoryId } : action.type === "discount" ? { percent: String(action.percent) } : {};
    const type = action.type === "discount" && action.percent <= 0 ? "clear_discount" : BULK_ACTION[action.type];
    const res = await api.post<{ updated: number[] }>(products.bulk, { ids, action: type, ...extra });
    return { updated: res.updated.length };
  },

  /** Ajustement de stock (entrée / sortie / inventaire) + historique. */
  async adjustStock(productId: number, input: StockAdjustInput): Promise<Product> {
    await api.post(products.stockAdjustments(productId), { mode: input.mode, value: input.value, reason: input.reason, note: input.note ?? "", variantId: input.variantId ?? null });
    return adminProductsService.detail(productId);
  },

  async stockMovements(productId: number): Promise<StockMovement[]> {
    const page = await api.get<PageEnvelope<StockMovementDto>>(products.stockMovements(productId), { params: { pageSize: 100 } });
    return page.results.map(toStockMovement);
  },

  /** Ventes du produit, toutes périodes (totaux de la liste des ventes). */
  async salesStats(productId: number): Promise<ProductStats> {
    const page = await api.get<PageEnvelope<unknown>>(sales.list, { params: { productId, pageSize: 1 } });
    const stats = page.meta.stats as { revenue: string; profit: string; units: number } | undefined;
    return { units: stats?.units ?? 0, revenue: money(stats?.revenue), profit: money(stats?.profit) };
  },

  /** Avis du produit (toutes modérations confondues, y compris produit en corbeille). */
  async reviews(productId: number): Promise<Review[]> {
    const page = await api.get<PageEnvelope<ReviewDto>>(reviews.list, { params: { productId, pageSize: 100 } });
    return page.results.map(toReview);
  },

  /** Import CSV par l'API : `dryRun` valide le fichier sans rien enregistrer. */
  async importCsv(file: File, dryRun: boolean): Promise<ImportSummary> {
    const form = new FormData();
    form.append("file", file);
    form.append("dry_run", String(dryRun));
    const job = await runJob(api.post<Job<ImportSummary>>(products.import, form));
    return job.summary;
  },

  async exportCatalog(format: "csv" | "xlsx"): Promise<void> {
    downloadJob(await runJob(api.post<Job>(products.export, { format })));
  },
};
