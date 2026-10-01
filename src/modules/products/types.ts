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
  inStock: boolean;
  freeShipping: boolean;
  shippingFee: number | null;
  /** Nombre de ventes (tri « meilleures ventes »). */
  salesCount?: number;
  isFavorite?: boolean;
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
