import { ENDPOINTS } from "@/config/endpoints";
import { api, ApiError, completeUploads, downloadJob, runJob, sendUpload, type Job, type PageEnvelope } from "@/shared/lib/api";
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

const { products, sales, reviews } = ENDPOINTS.admin;

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
 * Les fichiers partent vers Cloudinary dès leur choix (`upload`) ; ici on les attend puis on les enregistre en un appel.
 */
async function imageIds(images: ImageSlotValue[], current: string[]): Promise<number[] | undefined> {
  const kept = images.filter((s) => s.url && !s.file).map((s) => s.url as string);
  const slots = images.filter((s) => s.file);
  const unchanged = !slots.length && kept.length === current.length && kept.every((url, i) => url === current[i]);
  if (current.length && unchanged) return undefined;
  if (kept.length) {
    throw new ApiError(400, "Pour modifier les photos, remplacez toutes les images du produit.", { errors: { image: ["Remplacez toutes les images (les images existantes ne peuvent pas être conservées partiellement)."] } });
  }
  // un envoi anticipé qui a échoué (réseau coupé…) est retenté une fois
  const send = (s: ImageSlotValue) => sendUpload(s.file as File, "product_image");
  const sent = await Promise.all(slots.map((s) => (s.upload ?? send(s)).catch(() => send(s))));
  return (await completeUploads(sent)).map((m) => m.id);
}

/**
 * Variantes telles que l'API les attend : la liste complète (les absentes sont supprimées), `id` pour une
 * variante existante, sans `id` pour une nouvelle (le formulaire leur donne un id provisoire).
 */
function variantPayload(rows: VariantRow[], before: Product["variants"]) {
  const known = new Set(before.map((v) => v.id));
  return rows.map((r) => ({
    ...(known.has(r.id) ? { id: r.id } : {}),
    attributes: r.attributes,
    sku: r.sku.trim() || null,
    price: r.price === "" ? null : r.price,
    stock: Number(r.stock),
  }));
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

  /**
   * Création / modification en un seul appel : champs, galerie, variantes et stock. Un produit à variantes
   * n'envoie pas de stock global (l'API refuse : `variants_manage_stock`) ; la réponse est la fiche complète.
   */
  async save(before: Product | null, values: ProductFormValues, images: ImageSlotValue[]): Promise<Product> {
    const ids = await imageIds(images, before?.images ?? []);
    const variants = variantPayload(values.variants, before?.variants ?? []);
    const stock = variants.length ? {} : { stock: Number(values.stock) };
    const body = { ...toProductPayload(values), ...(ids ? { imageIds: ids } : {}), ...stock };
    if (!before) return toAdminProduct(await api.post<AdminProductDetailDto>(products.list, variants.length ? { ...body, variants } : body));
    const sync = variants.length || before.variants.length ? { variants } : {};
    return toAdminProduct(await api.patch<AdminProductDetailDto>(products.detail(before.id), { ...body, ...sync }));
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
