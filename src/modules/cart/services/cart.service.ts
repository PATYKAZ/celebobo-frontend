import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api } from "@/shared/lib/api";
import type { CartItem } from "../types";

/**
 * Le panier est géré localement (zustand) ; ces appels synchronisent le panier serveur
 * (session Django `utils.cart.Cart`) quand l'API est branchée. En mock : no-op.
 */
export const cartService = {
  async fetch(): Promise<CartItem[]> {
    if (env.USE_MOCKS) return [];
    const res = await api.get<{ items: CartItem[] }>(ENDPOINTS.cart.get);
    return res.items;
  },
  async add(productId: number, quantity = 1, variantId: number | null = null): Promise<void> {
    if (env.USE_MOCKS) return;
    await api.post(ENDPOINTS.cart.addItem, { productId, quantity, variantId });
  },
  async update(productId: number, quantity: number, variantId: number | null = null): Promise<void> {
    if (env.USE_MOCKS) return;
    await api.patch(ENDPOINTS.cart.updateItem(productId), { quantity, variantId });
  },
  async remove(productId: number, variantId: number | null = null): Promise<void> {
    if (env.USE_MOCKS) return;
    await api.delete(ENDPOINTS.cart.removeItem(productId), { params: { variantId } });
  },
  async clear(): Promise<void> {
    if (env.USE_MOCKS) return;
    await api.delete(ENDPOINTS.cart.clear);
  },
};
