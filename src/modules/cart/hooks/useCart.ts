"use client";

import { useCallback } from "react";
import { toast } from "@/shared/ui/Toast";
import type { Product } from "@/modules/products/types";
import { cartService } from "../services/cart.service";
import { cartCount, cartSavings, cartTotal, useCartStore } from "../store/cart.store";
import type { CartProduct } from "../types";

const toCartProduct = (p: Product | CartProduct): CartProduct => ({
  id: p.id,
  name: p.name,
  image: p.image,
  price: p.price,
  priceSolde: p.priceSolde,
  category: (p as Product).category,
  freeShipping: (p as Product).freeShipping,
});

/** Panier : état local + synchronisation API en arrière-plan. */
export function useCart() {
  const items = useCartStore((s) => s.items);
  const store = useCartStore;

  const add = useCallback(
    (product: Product | CartProduct, quantity = 1, opts?: { silent?: boolean }) => {
      store.getState().add(toCartProduct(product), quantity);
      cartService.add(product.id, quantity).catch(() => {});
      if (!opts?.silent) toast.success("Ajouté au panier", product.name);
    },
    [store],
  );

  const setQuantity = useCallback(
    (productId: number, quantity: number) => {
      store.getState().setQuantity(productId, quantity);
      (quantity <= 0 ? cartService.remove(productId) : cartService.update(productId, quantity)).catch(() => {});
    },
    [store],
  );

  const remove = useCallback(
    (productId: number) => {
      store.getState().remove(productId);
      cartService.remove(productId).catch(() => {});
    },
    [store],
  );

  const clear = useCallback(() => {
    store.getState().clear();
    cartService.clear().catch(() => {});
  }, [store]);

  return {
    items,
    count: cartCount(items),
    total: cartTotal(items),
    savings: cartSavings(items),
    isEmpty: items.length === 0,
    add,
    setQuantity,
    remove,
    clear,
    has: (productId: number) => items.some((i) => i.productId === productId),
  };
}
