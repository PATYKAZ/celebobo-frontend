import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse, nextMockId, paginate } from "@/shared/lib/api";
import { MOCK_CATEGORIES } from "@/modules/categories/mocks/categories";
import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { parseCare, type AdminProductListParams, type AdminProductPage, type ImageSlotValue, type ProductFormValues } from "../types";

/** Copie de travail en mémoire (mock). */
const store: Product[] = structuredClone(MOCK_PRODUCTS);

function stats(list: Product[]) {
  return {
    total: list.length,
    onSale: list.filter((p) => getPricing(p).onSale).length,
    outOfStock: list.filter((p) => !p.inStock).length,
    stockValue: list.filter((p) => p.inStock).reduce((s, p) => s + (p.pricePrimary ?? 0), 0),
  };
}

function applyValues(base: Product | null, v: ProductFormValues, images: ImageSlotValue[]): Product {
  const price = Number(v.price);
  const solde = v.priceSolde ? Number(v.priceSolde) : null;
  const onSale = solde != null && solde < price;
  const urls = images.map((i) => i.url).filter((u): u is string => !!u);
  const cat = MOCK_CATEGORIES.find((c) => c.id === Number(v.categoryId));
  return {
    id: base?.id ?? nextMockId(),
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
    inStock: v.inStock,
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
  fd.append("in_stock", String(v.inStock));
  const keys = ["image", "image_one", "image_two", "image_three"];
  images.forEach((img, i) => {
    if (img.file) fd.append(keys[i], img.file);
  });
  return fd;
}

export const adminProductsService = {
  list(params: AdminProductListParams = {}): Promise<AdminProductPage> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        let list = [...store].sort((a, b) => +new Date(b.dateAdded) - +new Date(a.dateAdded));
        if (params.search) {
          const q = params.search.toLowerCase();
          list = list.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q));
        }
        if (params.category) list = list.filter((p) => p.categoryId === params.category);
        if (params.onSale) list = list.filter((p) => getPricing(p).onSale);
        if (params.outOfStock) list = list.filter((p) => !p.inStock);
        return { ...paginate(list, params.page ?? 1, params.pageSize ?? 10), stats: stats(store) };
      }, 300);
    }
    return api.get<AdminProductPage>(ENDPOINTS.admin.products.list, { params: params as never });
  },

  async detail(id: number): Promise<Product> {
    if (env.USE_MOCKS) {
      const p = store.find((x) => x.id === id);
      if (!p) throw new ApiError(404, "Produit introuvable");
      return mockResponse(p, 250);
    }
    return api.get<Product>(ENDPOINTS.admin.products.detail(id));
  },

  async save(id: number | null, values: ProductFormValues, images: ImageSlotValue[]): Promise<Product> {
    if (env.USE_MOCKS) {
      const idx = id ? store.findIndex((p) => p.id === id) : -1;
      const next = applyValues(idx >= 0 ? store[idx] : null, values, images);
      if (idx >= 0) store[idx] = next;
      else store.unshift(next);
      return mockResponse(next, 600);
    }
    const body = toFormData(values, images);
    return id ? api.patch<Product>(ENDPOINTS.admin.products.update(id), body) : api.post<Product>(ENDPOINTS.admin.products.create, body);
  },

  async remove(id: number): Promise<void> {
    if (env.USE_MOCKS) {
      const idx = store.findIndex((p) => p.id === id);
      if (idx >= 0) store.splice(idx, 1);
      return mockResponse(undefined, 400);
    }
    await api.delete(ENDPOINTS.admin.products.remove(id));
  },
};
