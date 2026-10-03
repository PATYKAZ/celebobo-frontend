import type { Product, ProductSuggestion, ProductVariant, Review, ReviewEligibility } from "../types";

/** Carte produit de l'API (après camelCase). */
export interface ProductCardDto {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: { id: number; slug: string; name: string };
  image: string;
  price: string;
  salePrice: string | null;
  currentPrice: string;
  discountPercent: string | null;
  badge: "new" | "best_seller" | null;
  rating: string;
  reviewsCount: number;
  inStock: boolean;
  freeShipping: boolean;
  isFavorite: boolean;
}

export interface VariantDto {
  id: number;
  sku: string;
  label: string;
  attributes: Record<string, string>;
  price: string;
  inStock: boolean;
  stock: number;
  image: string;
}

export interface ProductDetailDto extends ProductCardDto {
  longDescription: string;
  images: string[];
  features: string[];
  careInstructions: string[];
  deliveryPolicyPrimary: string;
  deliveryPolicySecondary: string;
  shippingFee: string | null;
  lowStock: boolean;
  options: { name: string; values: string[] }[];
  variants: VariantDto[];
}

export interface ReviewDto {
  id: number;
  rating: number;
  message: string;
  verified: boolean;
  author: { id: number; name: string; avatar: string };
  createdAt: string;
}

export interface SuggestionDto {
  id: number;
  slug: string;
  name: string;
  category: string;
  image: string;
  currentPrice: string;
}

/** Les produits simples n'exposent pas leur quantité : plafond de saisie côté boutique (l'API valide le stock). */
const SIMPLE_PRODUCT_STOCK = 99;
const LOW_STOCK_THRESHOLD = 5;

export const BADGE_LABEL: Record<NonNullable<ProductCardDto["badge"]>, string> = {
  new: "Nouveauté",
  best_seller: "Meilleure vente",
};

export const money = (value: string | null | undefined): number => (value == null || value === "" ? 0 : Number(value));
const moneyOrNull = (value: string | null | undefined): number | null => (value == null || value === "" ? null : Number(value));

function toVariant(dto: VariantDto): ProductVariant {
  return { id: dto.id, attributes: dto.attributes, label: dto.label, price: moneyOrNull(dto.price), stock: dto.stock, sku: dto.sku, image: dto.image || null };
}

export function toProduct(dto: ProductCardDto | ProductDetailDto): Product {
  const detail = "variants" in dto ? dto : null;
  const badge = dto.badge ? BADGE_LABEL[dto.badge] : null;
  const variants = detail?.variants.map(toVariant) ?? [];
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    description: dto.description,
    longDescription: detail?.longDescription || null,
    price: money(dto.price),
    priceSolde: moneyOrNull(dto.salePrice),
    soldePercent: moneyOrNull(dto.discountPercent),
    category: dto.category.name,
    categoryId: dto.category.id,
    categorySlug: dto.category.slug,
    image: dto.image || null,
    images: detail?.images.length ? detail.images : dto.image ? [dto.image] : [],
    badge,
    currentBadge: badge ?? "",
    rating: Number(dto.rating) || null,
    reviewsCount: dto.reviewsCount,
    dateAdded: "",
    features: detail?.features ?? [],
    charaEntretienList: detail?.careInstructions ?? [],
    deliveryPolicyPhase1: detail?.deliveryPolicyPrimary || null,
    deliveryPolicyPhase2: detail?.deliveryPolicySecondary || null,
    inStock: dto.inStock,
    stock: variants.length ? variants.reduce((total, v) => total + v.stock, 0) : dto.inStock ? SIMPLE_PRODUCT_STOCK : 0,
    stockThreshold: LOW_STOCK_THRESHOLD,
    lowStock: detail?.lowStock ?? false,
    dateWish: null,
    variantOptions: detail?.options ?? [],
    variants,
    freeShipping: dto.freeShipping,
    shippingFee: moneyOrNull(detail?.shippingFee),
    isFavorite: dto.isFavorite,
  };
}

export function toReview(dto: ReviewDto): Review {
  return {
    id: dto.id,
    user: { id: dto.author.id, name: dto.author.name, avatar: dto.author.avatar || null },
    rating: dto.rating,
    message: dto.message,
    verified: dto.verified,
    dateCreated: dto.createdAt,
  };
}

export function toSuggestion(dto: SuggestionDto): ProductSuggestion {
  return { id: dto.id, slug: dto.slug, name: dto.name, image: dto.image || null, price: money(dto.currentPrice), priceSolde: null, category: dto.category };
}

export const toEligibility = (dto: { canReview: boolean; reason: string | null }): ReviewEligibility => ({ canReview: dto.canReview, reason: dto.reason });
