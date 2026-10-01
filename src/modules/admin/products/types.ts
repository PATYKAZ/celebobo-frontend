import type { Product } from "@/modules/products/types";
import type { Paginated } from "@/shared/lib/api";

export interface AdminProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: number | null;
  onSale?: boolean;
  outOfStock?: boolean;
}

export interface AdminProductStats {
  total: number;
  onSale: number;
  outOfStock: number;
  /** Valeur estimée du stock (somme des prix d'achat des produits en stock). */
  stockValue: number;
}

export type AdminProductPage = Paginated<Product> & { stats?: AdminProductStats };

/** Valeurs du formulaire (tout en chaînes pour les inputs). */
export interface ProductFormValues {
  name: string;
  description: string;
  longDescription: string;
  price: string;
  pricePrimary: string;
  priceSolde: string;
  categoryId: string;
  badge: string;
  features: string[];
  charaEntretien: string;
  deliveryPolicyPhase1: string;
  deliveryPolicyPhase2: string;
  freeShipping: boolean;
  shippingFee: string;
  inStock: boolean;
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
  inStock: true,
};

export const VERB_RE = /\b(est|avec|permet|offre|dispose|intègre|embarque|équipé)\b/i;
export const countSentences = (s: string) => s.split(/[.!?]+/).filter((x) => x.trim()).length;
export const parseCare = (s: string) => s.split(/[\n;]+/).map((x) => x.trim()).filter(Boolean);

export function productToForm(p: Product): ProductFormValues {
  return {
    name: p.name,
    description: p.description,
    longDescription: p.longDescription ?? "",
    price: String(p.price),
    pricePrimary: p.pricePrimary != null ? String(p.pricePrimary) : "",
    priceSolde: p.priceSolde != null ? String(p.priceSolde) : "",
    categoryId: p.categoryId != null ? String(p.categoryId) : "",
    badge: p.badge ?? "",
    features: [...p.features],
    charaEntretien: p.charaEntretienList.join("\n"),
    deliveryPolicyPhase1: p.deliveryPolicyPhase1 ?? "",
    deliveryPolicyPhase2: p.deliveryPolicyPhase2 ?? "",
    freeShipping: p.freeShipping,
    shippingFee: p.shippingFee != null ? String(p.shippingFee) : "",
    inStock: p.inStock,
  };
}

export type FormErrors = Partial<Record<keyof ProductFormValues | "image", string>>;

export function validateProductForm(v: ProductFormValues, hasImage: boolean): FormErrors {
  const e: FormErrors = {};
  if (!v.name.trim()) e.name = "Le nom est requis.";
  const d = v.description.trim();
  if (d.length < 20) e.description = "La description doit contenir au moins 20 caractères.";
  else if (d.length > 100) e.description = "La description ne doit pas dépasser 100 caractères.";
  else if (!VERB_RE.test(d)) e.description = "La description doit ressembler à une phrase complète (ex : contenir un verbe).";
  if (countSentences(v.longDescription) > 5) e.longDescription = "La description longue ne doit pas dépasser 5 phrases.";
  const price = Number(v.price);
  if (!v.price || Number.isNaN(price) || price <= 0) e.price = "Prix invalide.";
  if (v.priceSolde && (Number(v.priceSolde) <= 0 || Number(v.priceSolde) >= price)) e.priceSolde = "Le prix soldé doit être inférieur au prix normal.";
  if (v.pricePrimary && Number(v.pricePrimary) < 0) e.pricePrimary = "Prix d'achat invalide.";
  if (!v.categoryId) e.categoryId = "Choisissez une catégorie.";
  if (!hasImage) e.image = "Ajoutez au moins l'image principale.";
  return e;
}
