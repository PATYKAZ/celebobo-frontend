/** Instantané produit stocké dans le panier (évite un refetch pour l'affichage). */
export interface CartProduct {
  id: number;
  name: string;
  image: string | null;
  price: number;
  priceSolde: number | null;
  category?: string;
  freeShipping?: boolean;
}

export interface CartItem {
  productId: number;
  quantity: number;
  product: CartProduct;
}

/** Prix unitaire effectif d'une ligne. */
export const unitPrice = (item: CartItem) =>
  item.product.priceSolde != null && item.product.priceSolde < item.product.price
    ? item.product.priceSolde
    : item.product.price;
