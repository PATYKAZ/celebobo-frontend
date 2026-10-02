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
    (
      product: Product | CartProduct,
      quantity = 1,
      opts?: { silent?: boolean; variantId?: number | null; variantLabel?: string | null; /** écart de prix de la variante vs produit (appliqué au prix normal et soldé) */ priceDelta?: number },
    ) => {
      const base = toCartProduct(product);
      const d = opts?.priceDelta ?? 0;
      const priced = d ? { ...base, price: base.price + d, priceSolde: base.priceSolde != null ? base.priceSolde + d : null } : base;
      store.getState().add(priced, quantity, opts?.variantId ?? null, opts?.variantLabel ?? null);
      cartService.add(product.id, quantity, opts?.variantId ?? null).catch(() => {});
      if (!opts?.silent) toast.success("Ajouté au panier", opts?.variantLabel ? `${product.name} — ${opts.variantLabel}` : product.name);
    },
    [store],
  );

  const setQuantity = useCallback(
    (productId: number, quantity: number, variantId: number | null = null) => {
      store.getState().setQuantity(productId, quantity, variantId);
      (quantity <= 0 ? cartService.remove(productId, variantId) : cartService.update(productId, quantity, variantId)).catch(() => {});
    },
    [store],
  );

  const remove = useCallback(
    (productId: number, variantId: number | null = null) => {
      store.getState().remove(productId, variantId);
      cartService.remove(productId, variantId).catch(() => {});
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
