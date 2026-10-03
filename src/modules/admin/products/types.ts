import type { Product, ProductVariant, VariantOption } from "@/modules/products/types";
import type { Paginated } from "@/shared/lib/api";

export type ProductStatusFilter = "active" | "trash";

export interface AdminProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: number | null;
  onSale?: boolean;
  outOfStock?: boolean;
  lowStock?: boolean;
  /** Actifs (par défaut) ou corbeille */
  status?: ProductStatusFilter;
  badge?: ProductBadgeCode;
  minPrice?: number;
  maxPrice?: number;
}

/** Badges gérés par l'API ("" = aucun). */
export type ProductBadgeCode = "new" | "best_seller";
export const BADGE_OPTIONS: { value: ProductBadgeCode | ""; label: string }[] = [
  { value: "", label: "Aucun" },
  { value: "new", label: "Nouveauté" },
  { value: "best_seller", label: "Best-seller" },
];

export interface AdminProductStats {
  total: number;
  onSale: number;
  outOfStock: number;
  lowStock: number;
  /** Valeur du stock à l'achat : Σ stock × prix d'achat. */
  stockValue: number;
  trashed: number;
}

/** Mouvement de stock (le motif est le code de l'API : restock, sale, loss…). */
export interface StockMovement {
  id: number;
  productId: number;
  variantId: number | null;
  at: string;
  /** + entrée / − sortie */
  delta: number;
  reason: string;
  by: { name: string };
  note: string | null;
  balanceAfter: number;
}

export type AdminProductPage = Paginated<Product> & { stats?: AdminProductStats };

/** Ligne de variante dans le formulaire (chaînes pour les inputs). */
export interface VariantRow {
  id: number;
  attributes: Record<string, string>;
  label: string;
  price: string;
  stock: string;
  sku: string;
}

/** Valeurs du formulaire (tout en chaînes pour les inputs). */
export interface ProductFormValues {
  name: string;
  description: string;
  longDescription: string;
  price: string;
  pricePrimary: string;
  priceSolde: string;
  categoryId: string;
  badge: ProductBadgeCode | "";
  features: string[];
  charaEntretien: string;
  deliveryPolicyPhase1: string;
  deliveryPolicyPhase2: string;
  freeShipping: boolean;
  shippingFee: string;
  /** Stock global (ignoré s'il y a des variantes : somme des variantes) */
  stock: string;
  stockThreshold: string;
  /** « Devrait être vendu avant le » (yyyy-mm-dd) */
  dateWish: string;
  isActive: boolean;
  variantOptions: VariantOption[];
  variants: VariantRow[];
}

/** 4 emplacements : principale, imageOne, imageTwo, imageThree. */
export interface ImageSlotValue {
  /** URL existante ou aperçu local (blob:) */
  url: string | null;
  /** Nouveau fichier à envoyer */
  file?: File | null;
}

export const EMPTY_FORM: ProductFormValues = {
  name: "",
  description: "",
  longDescription: "",
  price: "",
  pricePrimary: "",
  priceSolde: "",
  categoryId: "",
  badge: "",
  features: [],
  charaEntretien: "",
  deliveryPolicyPhase1: "",
  deliveryPolicyPhase2: "",
  freeShipping: false,
  shippingFee: "",
  stock: "10",
  stockThreshold: "5",
  dateWish: "",
  isActive: true,
  variantOptions: [],
  variants: [],
};

/** Bornes de la description courte imposées par l'API. */
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 255;
export const countSentences = (s: string) => s.split(/[.!?]+/).filter((x) => x.trim()).length;
export const parseCare = (s: string) => s.split(/[\n;]+/).map((x) => x.trim()).filter(Boolean);

const variantToRow = (v: ProductVariant): VariantRow => ({
  id: v.id,
  attributes: { ...v.attributes },
  label: v.label,
  price: v.price != null ? String(v.price) : "",
  stock: String(v.stock),
  sku: v.sku ?? "",
});

export function productToForm(p: Product): ProductFormValues {
  return {
    name: p.name,
    description: p.description,
    longDescription: p.longDescription ?? "",
    price: String(p.price),
    pricePrimary: p.pricePrimary != null ? String(p.pricePrimary) : "",
    priceSolde: p.priceSolde != null ? String(p.priceSolde) : "",
    categoryId: p.categoryId != null ? String(p.categoryId) : "",
    badge: p.badgeCode ?? "",
    features: [...p.features],
    charaEntretien: p.charaEntretienList.join("\n"),
    deliveryPolicyPhase1: p.deliveryPolicyPhase1 ?? "",
    deliveryPolicyPhase2: p.deliveryPolicyPhase2 ?? "",
    freeShipping: p.freeShipping,
    shippingFee: p.shippingFee != null ? String(p.shippingFee) : "",
    stock: String(p.stock),
    stockThreshold: String(p.stockThreshold),
    dateWish: p.dateWish ? p.dateWish.slice(0, 10) : "",
    isActive: p.isActive !== false,
    variantOptions: p.variantOptions.map((o) => ({ name: o.name, values: [...o.values] })),
    variants: p.variants.map(variantToRow),
  };
}

export type FormErrors = Partial<Record<keyof ProductFormValues | "image", string>>;

export function validateProductForm(v: ProductFormValues, hasImage: boolean, isNew: boolean): FormErrors {
  const e: FormErrors = {};
  if (!v.name.trim()) e.name = "Le nom est requis.";
  const d = v.description.trim();
  if (d.length < DESCRIPTION_MIN) e.description = `La description doit contenir au moins ${DESCRIPTION_MIN} caractères.`;
  else if (d.length > DESCRIPTION_MAX) e.description = `La description ne doit pas dépasser ${DESCRIPTION_MAX} caractères.`;
  if (countSentences(v.longDescription) > 5) e.longDescription = "La description longue ne doit pas dépasser 5 phrases.";
  const price = Number(v.price);
  if (!v.price || Number.isNaN(price) || price <= 0) e.price = "Prix invalide.";
  if (v.priceSolde && (Number(v.priceSolde) <= 0 || Number(v.priceSolde) >= price)) e.priceSolde = "Le prix soldé doit être inférieur au prix normal.";
  if (v.pricePrimary && Number(v.pricePrimary) < 0) e.pricePrimary = "Prix d'achat invalide.";
  if (!v.categoryId) e.categoryId = "Choisissez une catégorie.";
  if (isNew && !hasImage) e.image = "Ajoutez au moins l'image principale.";
  if (!v.variants.length && (v.stock === "" || Number(v.stock) < 0 || !Number.isInteger(Number(v.stock)))) e.stock = "Stock invalide (entier ≥ 0).";
  if (v.stockThreshold === "" || Number(v.stockThreshold) < 0 || !Number.isInteger(Number(v.stockThreshold))) e.stockThreshold = "Seuil invalide.";
  if (v.dateWish && isNew && v.dateWish < new Date().toISOString().slice(0, 10)) e.dateWish = "La date ne peut pas être dans le passé.";
  if (v.variants.some((r) => r.stock === "" || Number(r.stock) < 0)) e.variants = "Chaque variante doit avoir un stock valide.";
  return e;
}

// ───────── Stock ─────────
export type StockState = "ok" | "low" | "out";
export const stockState = (p: Pick<Product, "stock" | "stockThreshold">): StockState => (p.stock <= 0 ? "out" : p.stock <= p.stockThreshold ? "low" : "ok");

export type StockReason = "restock" | "inventory" | "correction" | "loss" | "return";
export const STOCK_REASONS: { value: StockReason; label: string }[] = [
  { value: "restock", label: "Réapprovisionnement" },
  { value: "inventory", label: "Inventaire" },
  { value: "correction", label: "Correction d'inventaire" },
  { value: "loss", label: "Perte / casse" },
  { value: "return", label: "Retour client" },
];

export interface StockAdjustInput {
  /** "delta" : ± quantité ; "set" : fixe le stock à la valeur */
  mode: "delta" | "set";
  value: number;
  reason: StockReason;
  note?: string;
  /** Variante concernée (produits à variantes) */
  variantId?: number | null;
}

// ───────── Deadline « vendu avant le » ─────────
export type DeadlineState = "none" | "ok" | "near" | "overdue";
export function deadlineState(dateWish: string | null | undefined): { state: DeadlineState; days: number } {
  if (!dateWish) return { state: "none", days: 0 };
  const days = Math.ceil((new Date(dateWish.slice(0, 10)).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime()) / 86400000);
  return { state: days < 0 ? "overdue" : days <= 14 ? "near" : "ok", days };
}

// ───────── Actions groupées ─────────
export type BulkAction =
  | { type: "activate" }
  | { type: "deactivate" }
  | { type: "category"; categoryId: number }
  | { type: "discount"; percent: number }
  | { type: "trash" }
  | { type: "restore" };

export interface ProductStats {
  units: number;
  revenue: number;
  profit: number;
}
