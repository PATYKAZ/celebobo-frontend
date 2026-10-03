/** Instantané produit stocké dans le panier (évite un refetch pour l'affichage). */
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

/** Prix d'une variante (si différent du produit) à passer dans `product.price` lors de l'ajout. */

export interface CartItem {
  productId: number;
  quantity: number;
  product: CartProduct;
  /** Variante choisie (produit à variantes) */
  variantId?: number | null;
  variantLabel?: string | null;
}

/** Prix unitaire effectif d'une ligne. */
export const unitPrice = (item: CartItem) =>
  item.product.priceSolde != null && item.product.priceSolde < item.product.price
    ? item.product.priceSolde
    : item.product.price;
