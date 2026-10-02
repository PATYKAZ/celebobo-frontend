/**
 * Produit — correspond à shop.models.Product (Django), clés en camelCase.
 *
 * Tarification (cf. getPricing dans ../utils.ts) :
 *  - `price`      : prix de vente normal
 *  - `priceSolde` : prix soldé (si défini et < price) => affiché en rouge, `price` barré
 *  - `soldePercent` : % de remise calculé côté backend (Product.save)
 */
export interface Product {
  id: number;
  name: string;
  /** Description courte (20–100 caractères côté backend). */
  description: string;
  longDescription: string | null;
  price: number;
  priceSolde: number | null;
  soldePercent: number | null;
  /** Prix d'achat — jamais exposé aux clients, uniquement aux endpoints /admin/. */
  pricePrimary?: number | null;
  category: string;
  categoryId: number | null;
  /** Image principale (Product.image). */
  image: string | null;
  /** Galerie complète : image, imageOne, imageTwo, imageThree (sans doublon). */
  images: string[];
  badge: string | null;
  /** "Nouveauté" automatique pendant 20 jours, sinon `badge`. */
  currentBadge: string;
  rating: number | null;
  reviewsCount: number;
  dateAdded: string;
  features: string[];
  /** chara_entretien_list */
  charaEntretienList: string[];
  deliveryPolicyPhase1: string | null;
  deliveryPolicyPhase2: string | null;
  /** Champs d'affichage du design (stock, livraison) — à exposer côté API. */
  /** true si stock > 0 (dérivé côté API) */
  inStock: boolean;
  /** Quantité en stock (v2). */
  stock: number;
  /** Seuil d'alerte : stock <= seuil => « stock bas » */
  stockThreshold: number;
  /** « Devrait être vendu avant le » (Product.date_wish en v1), ISO date ou null */
  dateWish: string | null;
  /** Options de variantes (ex: Couleur: [Noir, Argent]). Vide = produit simple. */
  variantOptions: VariantOption[];
  variants: ProductVariant[];
  /** Suppression douce : ISO si dans la corbeille (admin) */
  deletedAt?: string | null;
  /** Visible en boutique */
  isActive?: boolean;
  freeShipping: boolean;
  shippingFee: number | null;
  /** Nombre de ventes (tri « meilleures ventes »). */
  salesCount?: number;
  isFavorite?: boolean;
}

export interface VariantOption {
  name: string;
  values: string[];
}

/** Variante vendable : combinaison d'options avec prix et stock propres. */
export interface ProductVariant {
  id: number;
  /** { Couleur: "Noir", Stockage: "256 Go" } */
  attributes: Record<string, string>;
  /** Libellé affichable "Noir / 256 Go" */
  label: string;
  /** Prix de cette variante (sinon prix du produit) */
  price: number | null;
  stock: number;
  sku?: string | null;
  image?: string | null;
}

export type ProductOrdering = "-date_added" | "date_added" | "price" | "-price" | "-sales" | "-rating" | "name";

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** id de catégorie */
  category?: number | null;
  ordering?: ProductOrdering;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  /** "new" => nouveautés uniquement */
  badge?: string;
  ids?: number[];
  /** admin : inclure la corbeille */
  trashed?: boolean;
  /** admin : stock bas uniquement */
  lowStock?: boolean;
  /** admin : % de remise minimum */
  minDiscount?: number;
}

export interface Review {
  id: number;
  productId: number;
  user: { id: number; name: string; avatar: string | null };
  rating: number;
  message: string;
  dateCreated: string;
}

export interface NewReviewInput {
  rating: number;
  message: string;
}
