import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { productsService } from "@/modules/products/services/products.service";
import type { Product } from "@/modules/products/types";
import { useCartStore } from "../store/cart.store";
import { EMPTY_CART, type Cart, type CartProduct } from "../types";
import { toCart, type CartDto } from "./cart.mapper";

const CART_HEADER = "X-Cart-Token";

/** Fiches produit déjà connues (ajouts depuis le catalogue) : évite de les recharger pour afficher le panier. */
const products = new Map<number, CartProduct>();

export const toCartProduct = (p: Product | CartProduct): CartProduct => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  image: p.image,
  price: p.price,
  priceSolde: p.priceSolde,
  category: p.category,
  freeShipping: p.freeShipping,
});

async function loadProducts(ids: number[]): Promise<void> {
  const missing = [...new Set(ids)].filter((id) => !products.has(id));
  if (!missing.length) return;
  try {
    const page = await productsService.list({ ids: missing, pageSize: missing.length });
    page.results.forEach((p) => products.set(p.id, toCartProduct(p)));
  } catch {
    // affichage dégradé (sans lien produit) plutôt qu'un panier en erreur
  }
}

const opts = () => {
  const token = useCartStore.getState().token;
  return token ? { headers: { [CART_HEADER]: token } } : {};
};

/** Le jeton invité est émis par l'API au premier ajout : on le conserve pour les appels suivants. */
async function resolve(dto: CartDto | undefined): Promise<Cart> {
  if (!dto) return cartService.get();
  if (dto.token && dto.token !== useCartStore.getState().token) useCartStore.getState().setToken(dto.token);
  await loadProducts(dto.lines.map((l) => l.productId));
  return toCart(dto, products);
}

export const cartService = {
  remember(product: Product | CartProduct): void {
    products.set(product.id, toCartProduct(product));
  },

  async get(): Promise<Cart> {
    return resolve(await api.get<CartDto>(ENDPOINTS.cart.get, opts()));
  },

  async add(productId: number, quantity = 1, variantId: number | null = null): Promise<Cart> {
    return resolve(await api.post<CartDto>(ENDPOINTS.cart.items, { productId, variantId, quantity }, opts()));
  },

  async update(itemId: number, quantity: number): Promise<Cart> {
    return resolve(await api.patch<CartDto>(ENDPOINTS.cart.item(itemId), { quantity }, opts()));
  },

  async remove(itemId: number): Promise<Cart> {
    return resolve(await api.delete<CartDto | undefined>(ENDPOINTS.cart.item(itemId), opts()));
  },

  async clear(): Promise<Cart> {
    await api.delete(ENDPOINTS.cart.get, opts());
    return EMPTY_CART;
  },

  async applyCoupon(code: string): Promise<Cart> {
    return resolve(await api.post<CartDto>(ENDPOINTS.cart.coupon, { code }, opts()));
  },

  async removeCoupon(): Promise<Cart> {
    return resolve(await api.delete<CartDto | undefined>(ENDPOINTS.cart.coupon, opts()));
  },

  /** Fusionne le panier invité dans celui du compte connecté. */
  async merge(token: string): Promise<Cart> {
    return resolve(await api.post<CartDto>(ENDPOINTS.cart.merge, { token }));
  },
};
