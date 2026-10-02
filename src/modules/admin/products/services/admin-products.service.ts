import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse, paginate } from "@/shared/lib/api";
import { DB, type DbStockMovement } from "@/shared/mock-db";
import { actorName, getActor, isValidSale, logAudit, nextId, saleCost, saleTotal } from "@/shared/mock-db/selectors";
import { can } from "@/modules/auth/permissions";
import { MOCK_CATEGORIES } from "@/modules/categories/mocks/categories";
import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import type { Product, ProductVariant } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { recountCategories } from "../../categories/services/recount";
import {
  parseCare,
  stockState,
  type AdminProductListParams,
  type AdminProductPage,
  type AdminProductStats,
  type BulkAction,
  type ImageSlotValue,
  type ProductFormValues,
  type ProductStats,
  type StockAdjustInput,
} from "../types";
import type { ImportData } from "../utils/csv";

/** Source de vérité mock = tableau PARTAGÉ avec la boutique (les modifications admin y sont visibles). */
const store: Product[] = MOCK_PRODUCTS;

const find = (id: number) => {
  const p = store.find((x) => x.id === id);
  if (!p) throw new ApiError(404, "Produit introuvable");
  return p;
};
const requireCan = (perm: Parameters<typeof can>[1], msg: string) => {
  if (!can(getActor(), perm)) throw new ApiError(403, msg);
};

function computeStats(): AdminProductStats {
  const live = store.filter((p) => !p.deletedAt);
  return {
    total: live.length,
    onSale: live.filter((p) => getPricing(p).onSale).length,
    outOfStock: live.filter((p) => stockState(p) === "out").length,
    lowStock: live.filter((p) => stockState(p) === "low").length,
    stockValue: live.reduce((s, p) => s + p.stock * (p.pricePrimary ?? 0), 0),
    trashed: store.filter((p) => p.deletedAt).length,
  };
}

function filterList(params: AdminProductListParams): Product[] {
  let list = store.filter((p) => (params.status === "trash" ? !!p.deletedAt : !p.deletedAt));
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter((p) => `${p.name} ${p.category} ${p.badge ?? ""}`.toLowerCase().includes(q));
  }
  if (params.category) list = list.filter((p) => p.categoryId === params.category);
  if (params.onSale) list = list.filter((p) => getPricing(p).onSale);
  if (params.outOfStock) list = list.filter((p) => stockState(p) === "out");
  if (params.lowStock) list = list.filter((p) => stockState(p) === "low");
  if (params.badge) list = list.filter((p) => (p.currentBadge || p.badge || "").toLowerCase() === params.badge!.toLowerCase());
  if (params.minPrice != null) list = list.filter((p) => getPricing(p).current >= params.minPrice!);
  if (params.maxPrice != null) list = list.filter((p) => getPricing(p).current <= params.maxPrice!);
  if (params.minDiscount) list = list.filter((p) => getPricing(p).percent >= params.minDiscount!);
  return [...list].sort((a, b) => +new Date(b.dateAdded) - +new Date(a.dateAdded));
}

const dateOnly = (iso: string | null) => (iso ? iso.slice(0, 10) : null);

/** Applique les valeurs du formulaire sur un produit (existant ou nouveau). */
function applyValues(base: Product | null, v: ProductFormValues, images: ImageSlotValue[]): Product {
  const price = Number(v.price);
  const solde = v.priceSolde ? Number(v.priceSolde) : null;
  const onSale = solde != null && solde < price;
  const urls = images.map((i) => i.url).filter((u): u is string => !!u);
  const cat = MOCK_CATEGORIES.find((c) => c.id === Number(v.categoryId));
  const variants: ProductVariant[] = v.variants.map((r) => ({
    id: r.id,
    attributes: r.attributes,
    label: r.label,
    price: r.price ? Number(r.price) : null,
    stock: Number(r.stock) || 0,
    sku: r.sku || null,
    image: null,
  }));
  const stock = variants.length ? variants.reduce((n, x) => n + x.stock, 0) : Number(v.stock) || 0;
  return {
    id: base?.id ?? Math.max(0, ...store.map((p) => p.id)) + 1,
    name: v.name.trim(),
    description: v.description.trim(),
    longDescription: v.longDescription.trim() || null,
    price,
    priceSolde: onSale ? solde : null,
    soldePercent: onSale ? Math.round(((price - (solde as number)) / price) * 10000) / 100 : null,
    pricePrimary: v.pricePrimary ? Number(v.pricePrimary) : null,
    category: cat?.name ?? base?.category ?? "",
    categoryId: cat?.id ?? null,
    image: urls[0] ?? null,
    images: urls,
    badge: v.badge.trim() || null,
    currentBadge: base?.currentBadge ?? (v.badge.trim() || "Nouveauté"),
    rating: base?.rating ?? null,
    reviewsCount: base?.reviewsCount ?? 0,
    dateAdded: base?.dateAdded ?? new Date().toISOString(),
    features: v.features,
    charaEntretienList: parseCare(v.charaEntretien),
    deliveryPolicyPhase1: v.deliveryPolicyPhase1.trim() || null,
    deliveryPolicyPhase2: v.deliveryPolicyPhase2.trim() || null,
    inStock: stock > 0,
    stock,
    stockThreshold: Number(v.stockThreshold) || 0,
    dateWish: dateOnly(v.dateWish || null),
    variantOptions: v.variantOptions,
    variants,
    deletedAt: base?.deletedAt ?? null,
    isActive: v.isActive,
    freeShipping: v.freeShipping,
    shippingFee: v.shippingFee ? Number(v.shippingFee) : null,
    salesCount: base?.salesCount ?? 0,
  };
}

/** FormData (snake_case) pour l'API Django multipart. */
function toFormData(v: ProductFormValues, images: ImageSlotValue[]): FormData {
  const fd = new FormData();
  const set = (k: string, val: string | boolean | null | undefined) => {
    if (val === null || val === undefined || val === "") return;
    fd.append(k, String(val));
  };
  set("name", v.name);
  set("description", v.description);
  set("long_description", v.longDescription);
  set("price", v.price);
  set("price_primary", v.pricePrimary);
  set("price_solde", v.priceSolde);
  set("category_fk", v.categoryId);
  set("badge", v.badge);
  v.features.forEach((f) => fd.append("features", f));
  set("chara_entretien", v.charaEntretien);
  set("delivery_policy_phase1", v.deliveryPolicyPhase1);
  set("delivery_policy_phase2", v.deliveryPolicyPhase2);
  fd.append("free_shipping", String(v.freeShipping));
  set("shipping_fee", v.shippingFee);
  set("stock", v.stock);
  set("stock_threshold", v.stockThreshold);
  set("date_wish", v.dateWish);
  fd.append("is_active", String(v.isActive));
  fd.append("variant_options", JSON.stringify(v.variantOptions));
  fd.append("variants", JSON.stringify(v.variants.map((r) => ({ id: r.id, attributes: r.attributes, label: r.label, price: r.price ? Number(r.price) : null, stock: Number(r.stock) || 0, sku: r.sku || null }))));
  const keys = ["image", "image_one", "image_two", "image_three"];
  images.forEach((img, i) => {
    if (img.file) fd.append(keys[i], img.file);
  });
  return fd;
}

/** Journalise les changements sensibles (prix, prix soldé, prix d'achat). */
function auditPriceChanges(before: Product, after: Product) {
  const diff = (["price", "priceSolde", "pricePrimary"] as const)
    .filter((f) => (before[f] ?? null) !== (after[f] ?? null))
    .map((f) => ({ field: f, from: before[f] ?? null, to: after[f] ?? null }));
  if (diff.length) logAudit({ action: "Prix modifié", entity: "produit", entityId: after.id, summary: `${after.name} : ${diff.map((d) => d.field).join(", ")}`, diff });
}

function pushMovement(p: Product, delta: number, reason: DbStockMovement["reason"], note?: string | null) {
  const a = getActor();
  DB.stockMovements.unshift({ id: nextId("stock"), productId: p.id, at: new Date().toISOString(), delta, reason, by: { id: a.id, name: actorName(a) }, note: note ?? null, balanceAfter: p.stock });
}

export const adminProductsService = {
  list(params: AdminProductListParams = {}): Promise<AdminProductPage> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const list = filterList(params);
        const page = params.all ? { count: list.length, next: null, previous: null, results: list } : paginate(list, params.page ?? 1, params.pageSize ?? 10);
        return { ...page, stats: computeStats() };
      }, 300);
    }
    return api.get<AdminProductPage>(ENDPOINTS.admin.products.list, { params: params as never });
  },

  async detail(id: number): Promise<Product> {
    if (env.USE_MOCKS) return mockResponse(find(id), 250);
    return api.get<Product>(ENDPOINTS.admin.products.detail(id));
  },

  async save(id: number | null, values: ProductFormValues, images: ImageSlotValue[]): Promise<Product> {
    if (env.USE_MOCKS) {
      requireCan("products.manage", "Votre rôle ne permet pas de modifier le catalogue.");
      const idx = id ? store.findIndex((p) => p.id === id) : -1;
      const before = idx >= 0 ? { ...store[idx] } : null;
      const next = applyValues(idx >= 0 ? store[idx] : null, values, images);
      if (idx >= 0) {
        if (before && before.stock !== next.stock) pushMovement(next, next.stock - before.stock, "correction", "Modification depuis la fiche produit");
        Object.assign(store[idx], next); // mutation en place : la boutique voit le changement
        auditPriceChanges(before as Product, store[idx]);
      } else {
        store.unshift(next);
        pushMovement(next, next.stock, "inventaire", "Création du produit");
        logAudit({ action: "Produit créé", entity: "produit", entityId: next.id, summary: `Création : « ${next.name} »` });
      }
      recountCategories();
      return mockResponse(idx >= 0 ? store[idx] : next, 600);
    }
    const body = toFormData(values, images);
    return id ? api.patch<Product>(ENDPOINTS.admin.products.update(id), body) : api.post<Product>(ENDPOINTS.admin.products.create, body);
  },

  /** Suppression DOUCE → corbeille. */
  async trash(ids: number[]): Promise<void> {
    if (env.USE_MOCKS) {
      requireCan("products.manage", "Permission insuffisante.");
      for (const id of ids) {
        const p = find(id);
        p.deletedAt = new Date().toISOString();
        logAudit({ action: "Produit supprimé", entity: "produit", entityId: id, summary: `Mise à la corbeille : « ${p.name} »` });
      }
      recountCategories();
      return mockResponse(undefined, 400);
    }
    await api.post(ENDPOINTS.admin.productsBulk.action, { ids, action: "trash" });
  },

  async restore(ids: number[]): Promise<void> {
    if (env.USE_MOCKS) {
      requireCan("products.manage", "Permission insuffisante.");
      for (const id of ids) {
        const p = find(id);
        p.deletedAt = null;
        logAudit({ action: "Produit restauré", entity: "produit", entityId: id, summary: `Restauration : « ${p.name} »` });
      }
      recountCategories();
      return mockResponse(undefined, 400);
    }
    await Promise.all(ids.map((id) => api.post(ENDPOINTS.admin.productsBulk.restore(id))));
  },

  /** Suppression DÉFINITIVE (admin uniquement). */
  async purge(id: number): Promise<void> {
    if (env.USE_MOCKS) {
      requireCan("products.delete", "Seul un administrateur peut supprimer définitivement un produit.");
      const idx = store.findIndex((p) => p.id === id);
      if (idx < 0) throw new ApiError(404, "Produit introuvable");
      const [p] = store.splice(idx, 1);
      logAudit({ action: "Produit supprimé définitivement", entity: "produit", entityId: id, summary: `Suppression définitive : « ${p.name} »` });
      recountCategories();
      return mockResponse(undefined, 400);
    }
    await api.delete(ENDPOINTS.admin.products.remove(id));
  },

  async bulk(ids: number[], action: BulkAction): Promise<{ updated: number }> {
    if (env.USE_MOCKS) {
      requireCan("products.manage", "Permission insuffisante.");
      for (const id of ids) {
        const p = find(id);
        switch (action.type) {
          case "activate":
            p.isActive = true;
            break;
          case "deactivate":
            p.isActive = false;
            break;
          case "trash":
            p.deletedAt = new Date().toISOString();
            break;
          case "restore":
            p.deletedAt = null;
            break;
          case "category": {
            const c = MOCK_CATEGORIES.find((x) => x.id === action.categoryId);
            if (c) {
              p.categoryId = c.id;
              p.category = c.name;
            }
            break;
          }
          case "discount": {
            const before = { ...p };
            p.priceSolde = action.percent > 0 ? Math.round(p.price * (1 - action.percent / 100) * 100) / 100 : null;
            p.soldePercent = action.percent > 0 ? action.percent : null;
            auditPriceChanges(before, p);
            break;
          }
        }
      }
      logAudit({ action: "Action groupée", entity: "produit", entityId: null, summary: `${ids.length} produit(s) : ${action.type}` });
      recountCategories();
      return mockResponse({ updated: ids.length }, 500);
    }
    return api.post<{ updated: number }>(ENDPOINTS.admin.productsBulk.action, { ids, ...action });
  },

  /** Ajustement de stock (entrée / sortie / inventaire) + historique. */
  async adjustStock(productId: number, input: StockAdjustInput): Promise<Product> {
    if (env.USE_MOCKS) {
      requireCan("stock.adjust", "Votre rôle ne permet pas d'ajuster le stock.");
      const p = find(productId);
      const before = p.stock;
      const target = input.variantId != null ? p.variants.find((v) => v.id === input.variantId) : null;
      const current = target ? target.stock : p.stock;
      const next = Math.max(0, input.mode === "set" ? input.value : current + input.value);
      if (target) {
        target.stock = next;
        p.stock = p.variants.reduce((n, v) => n + v.stock, 0);
      } else p.stock = next;
      p.inStock = p.stock > 0;
      pushMovement(p, p.stock - before, input.reason, [target ? `Variante ${target.label}` : null, input.note].filter(Boolean).join(" — ") || null);
      logAudit({ action: "Stock ajusté", entity: "stock", entityId: productId, summary: `${p.name} : ${p.stock - before >= 0 ? "+" : ""}${p.stock - before} (${input.reason})`, diff: [{ field: "stock", from: before, to: p.stock }] });
      return mockResponse(p, 400);
    }
    return api.post<Product>(ENDPOINTS.admin.stock.adjust(productId), input);
  },

  stockMovements(productId: number): Promise<DbStockMovement[]> {
    if (env.USE_MOCKS) return mockResponse(() => DB.stockMovements.filter((m) => m.productId === productId).sort((a, b) => +new Date(b.at) - +new Date(a.at)), 250);
    return api.get<DbStockMovement[]>(ENDPOINTS.admin.stock.movements(productId));
  },

  /** Statistiques de vente du produit (depuis la base de démo unique). */
  async salesStats(productId: number): Promise<ProductStats> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const list = DB.sales.filter((s) => s.productId === productId && isValidSale(s));
        return { units: list.reduce((n, s) => n + s.quantity, 0), revenue: list.reduce((n, s) => n + saleTotal(s), 0), profit: list.reduce((n, s) => n + saleTotal(s) - saleCost(s), 0) };
      }, 200);
    }
    return api.get<ProductStats>(`${ENDPOINTS.admin.products.detail(productId)}stats/`);
  },

  /** Import CSV validé côté client : crée (sans id) ou met à jour (id existant). */
  async importRows(rows: { id: number | null; data: ImportData }[]): Promise<{ created: number; updated: number }> {
    if (env.USE_MOCKS) {
      requireCan("products.import", "Votre rôle ne permet pas d'importer des produits.");
      let created = 0;
      let updated = 0;
      for (const { id, data } of rows) {
        const cat = MOCK_CATEGORIES.find((c) => c.id === data.categoryId);
        const solde = data.priceSolde != null && data.priceSolde < data.price ? data.priceSolde : null;
        const patch = {
          name: data.name,
          description: data.description,
          price: data.price,
          priceSolde: solde,
          soldePercent: solde != null ? Math.round(((data.price - solde) / data.price) * 10000) / 100 : null,
          pricePrimary: data.pricePrimary,
          category: cat?.name ?? "",
          categoryId: data.categoryId,
          badge: data.badge,
          stock: data.stock,
          stockThreshold: data.stockThreshold,
          inStock: data.stock > 0,
          dateWish: data.dateWish,
          freeShipping: data.freeShipping,
          shippingFee: data.shippingFee,
          isActive: data.isActive,
        };
        if (id != null) {
          const p = find(id);
          const before = { ...p };
          Object.assign(p, patch);
          auditPriceChanges(before, p);
          updated++;
        } else {
          const nid = Math.max(0, ...store.map((p) => p.id)) + 1;
          const base = store[0];
          store.unshift({
            ...base,
            ...patch,
            id: nid,
            longDescription: null,
            image: null,
            images: [],
            currentBadge: data.badge ?? "Nouveauté",
            rating: null,
            reviewsCount: 0,
            dateAdded: new Date().toISOString(),
            features: [],
            charaEntretienList: [],
            variantOptions: [],
            variants: [],
            deletedAt: null,
            salesCount: 0,
          });
          created++;
        }
      }
      logAudit({ action: "Import CSV", entity: "produit", entityId: null, summary: `${created} créé(s), ${updated} mis à jour` });
      recountCategories();
      return mockResponse({ created, updated }, 700);
    }
    return api.post<{ created: number; updated: number }>(ENDPOINTS.admin.productsBulk.importCsv, { rows });
  },
};
