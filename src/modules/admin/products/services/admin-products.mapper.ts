import { BADGE_LABEL, money } from "@/modules/products/services/products.mapper";
import type { Product } from "@/modules/products/types";
import { parseCare, type AdminProductStats, type ProductFormValues, type StockMovement } from "../types";

/** Ligne de la liste du back-office (après camelCase). */
export interface AdminProductRowDto {
  id: number;
  slug: string;
  name: string;
  category: { id: number; slug: string; name: string };
  image: string;
  price: string;
  salePrice: string | null;
  costPrice: string | null;
  currentPrice: string;
  marginPercent: string | null;
  stock: number;
  stockThreshold: number;
  lowStock: boolean;
  status: "active" | "inactive" | "trash";
  badge: "new" | "best_seller" | null;
  variantsCount: number;
  salesCount: number;
  rating: string;
  updatedAt: string;
}

export interface AdminVariantDto {
  id: number;
  sku: string;
  label: string;
  attributes: Record<string, string>;
  price: string | null;
  stock: number;
  image: string;
  isActive: boolean;
}

export interface AdminProductDetailDto extends AdminProductRowDto {
  description: string;
  longDescription: string;
  careInstructions: string;
  deliveryPolicyPrimary: string;
  deliveryPolicySecondary: string;
  freeShipping: boolean;
  shippingFee: string | null;
  sellBy: string | null;
  features: string[];
  options: { name: string; values: string[] }[];
  images: { url: string; position: number }[];
  variants: AdminVariantDto[];
}

export interface AdminStatsDto {
  total: number;
  active: number;
  onSale: number;
  outOfStock: number;
  lowStock: number;
  stockValue: string;
  trashed: number;
}

export interface StockMovementDto {
  id: number;
  productId: number;
  variantId: number | null;
  delta: number;
  balanceAfter: number;
  reason: string;
  note: string;
  actorName: string | null;
  createdAt: string;
}

const orNull = (v: string | null | undefined) => (v == null || v === "" ? null : Number(v));
const orEmpty = (v: string) => (v.trim() === "" ? null : v.trim());

export function toAdminProduct(dto: AdminProductRowDto | AdminProductDetailDto): Product {
  const detail = "variants" in dto ? dto : null;
  const price = money(dto.price);
  const sale = orNull(dto.salePrice);
  const images = detail?.images.length ? [...detail.images].sort((a, b) => a.position - b.position).map((i) => i.url) : dto.image ? [dto.image] : [];
  const badge = dto.badge ? BADGE_LABEL[dto.badge] : null;
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    description: detail?.description ?? "",
    longDescription: detail?.longDescription || null,
    price,
    priceSolde: sale,
    soldePercent: sale != null && price > 0 ? Math.round(((price - sale) / price) * 10000) / 100 : null,
    pricePrimary: orNull(dto.costPrice),
    category: dto.category.name,
    categoryId: dto.category.id,
    categorySlug: dto.category.slug,
    image: images[0] ?? null,
    images,
    badge,
    badgeCode: dto.badge,
    currentBadge: badge ?? "",
    rating: Number(dto.rating) || null,
    reviewsCount: 0,
    dateAdded: dto.updatedAt,
    features: detail?.features ?? [],
    charaEntretienList: detail ? parseCare(detail.careInstructions) : [],
    deliveryPolicyPhase1: detail?.deliveryPolicyPrimary || null,
    deliveryPolicyPhase2: detail?.deliveryPolicySecondary || null,
    inStock: dto.stock > 0,
    stock: dto.stock,
    stockThreshold: dto.stockThreshold,
    lowStock: dto.lowStock,
    dateWish: detail?.sellBy ?? null,
    variantOptions: detail?.options ?? [],
    variants: (detail?.variants ?? []).map((v) => ({ id: v.id, attributes: v.attributes, label: v.label, price: orNull(v.price), stock: v.stock, sku: v.sku, image: v.image || null })),
    deletedAt: dto.status === "trash" ? dto.updatedAt : null,
    isActive: dto.status === "active",
    freeShipping: detail?.freeShipping ?? false,
    shippingFee: orNull(detail?.shippingFee),
    salesCount: dto.salesCount,
  };
}

export const toAdminStats = (dto: AdminStatsDto): AdminProductStats => ({
  total: dto.total,
  onSale: dto.onSale,
  outOfStock: dto.outOfStock,
  lowStock: dto.lowStock,
  stockValue: money(dto.stockValue),
  trashed: dto.trashed,
});

export const toStockMovement = (dto: StockMovementDto): StockMovement => ({
  id: dto.id,
  productId: dto.productId,
  variantId: dto.variantId,
  at: dto.createdAt,
  delta: dto.delta,
  reason: dto.reason,
  by: { name: dto.actorName ?? "Système" },
  note: dto.note || null,
  balanceAfter: dto.balanceAfter,
});

/** Corps commun création / modification (le stock et les variantes passent par leurs propres routes). */
export function toProductPayload(v: ProductFormValues) {
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    longDescription: v.longDescription.trim(),
    categoryId: Number(v.categoryId),
    price: v.price,
    salePrice: orEmpty(v.priceSolde),
    costPrice: orEmpty(v.pricePrimary),
    badge: v.badge || null,
    features: v.features.map((f) => f.trim()).filter(Boolean),
    careInstructions: parseCare(v.charaEntretien).join("\n"),
    deliveryPolicyPrimary: v.deliveryPolicyPhase1.trim(),
    deliveryPolicySecondary: v.deliveryPolicyPhase2.trim(),
    freeShipping: v.freeShipping,
    shippingFee: v.freeShipping ? null : orEmpty(v.shippingFee),
    stockThreshold: Number(v.stockThreshold),
    sellBy: v.dateWish || null,
    isActive: v.isActive,
    options: v.variantOptions.filter((o) => o.name.trim() && o.values.length),
  };
}
