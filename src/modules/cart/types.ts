/** Instantané produit d'une ligne (nom, image, slug pour le lien, prix barré). */
export interface CartProduct {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  priceSolde: number | null;
  category?: string;
  freeShipping?: boolean;
}

export interface CartItem {
  /** Ligne du panier serveur (négatif tant que l'ajout optimiste n'est pas confirmé). */
  id: number;
  productId: number;
  quantity: number;
  product: CartProduct;
  /** Variante choisie (produit à variantes) */
  variantId?: number | null;
  variantLabel?: string | null;
  /** false : produit retiré du catalogue ou plus vendable (exclu des totaux et de la commande). */
  available?: boolean;
}

/** Totaux calculés par l'API (panier et devis de commande). */
export interface CartQuote {
  subtotal: number;
  /** Remise du code promo */
  discount: number;
  shippingFee: number;
  total: number;
  /** Montant restant pour la livraison offerte (null : pas de seuil dans la zone). */
  freeShippingRemaining: number | null;
  shippingZone: string | null;
  deliveryEstimate: string | null;
  couponCode: string | null;
  /** Code promo enregistré mais devenu inapplicable (minimum non atteint, expiré…). */
  couponError: string | null;
  /** Points de fidélité utilisables sur cette commande (0 : rien à proposer), 1 point = 1 $ */
  pointsAvailable: number;
  /** Points appliqués au total (montant choisi par le client, plafonné par l'API) */
  points: number;
  /** Retrait en boutique choisi (frais 0) */
  pickup: boolean;
  /** Adresse du point de retrait (devis en retrait) */
  pickupAddress: string | null;
  /** Zone sur devis : frais inconnus jusqu'à la proposition du revendeur */
  shippingQuoteRequired: boolean;
  /** La boutique propose le retrait sur place */
  pickupAvailable: boolean;
}

export interface Cart {
  /** Jeton du panier invité (null pour un panier de compte). */
  token: string | null;
  items: CartItem[];
  quote: CartQuote;
}

export const EMPTY_QUOTE: CartQuote = {
  subtotal: 0,
  discount: 0,
  shippingFee: 0,
  total: 0,
  freeShippingRemaining: null,
  shippingZone: null,
  deliveryEstimate: null,
  couponCode: null,
  couponError: null,
  pointsAvailable: 0,
  points: 0,
  pickup: false,
  pickupAddress: null,
  shippingQuoteRequired: false,
  pickupAvailable: false,
};

export const EMPTY_CART: Cart = { token: null, items: [], quote: EMPTY_QUOTE };

/** Prix unitaire effectif d'une ligne. */
export const unitPrice = (item: CartItem) =>
  item.product.priceSolde != null && item.product.priceSolde < item.product.price
    ? item.product.priceSolde
    : item.product.price;
