"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/shared/lib/api";
import { toast } from "@/shared/ui/Toast";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { Product } from "@/modules/products/types";
import { cartService, toCartProduct } from "../services/cart.service";
import { cartCount, cartSavings, cartTotal, useCartStore } from "../store/cart.store";
import { EMPTY_CART, type Cart, type CartItem, type CartProduct } from "../types";

/** Propriétaire du panier en cache : "guest" (anonyme) ou "u:<id>" (utilisateur connecté). */
export type CartOwner = "guest" | `u:${number}`;

export const cartKeys = {
  all: ["cart"] as const,
  owner: (owner: CartOwner) => ["cart", owner] as const,
};

export const currentCartOwner = (): CartOwner => {
  const id = useAuthStore.getState().user?.id;
  return id ? `u:${id}` : "guest";
};

const same = (i: CartItem, productId: number, variantId?: number | null) => i.productId === productId && (i.variantId ?? null) === (variantId ?? null);

/** Les écritures sont jouées l'une après l'autre : une ligne ajoutée a son id serveur avant d'être modifiée. */
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

/** Mise à jour optimiste du cache, puis alignement sur la réponse serveur (ou rechargement en cas d'échec). */
function write(qc: QueryClient, optimistic: (cart: Cart) => Cart, call: () => Promise<Cart>, errorTitle: string): Promise<void> {
  const key = cartKeys.owner(currentCartOwner());
  const previous = qc.getQueryData<Cart>(key);
  qc.setQueryData<Cart>(key, optimistic(previous ?? EMPTY_CART));
  return enqueue(call)
    .then((cart) => {
      qc.setQueryData(key, cart);
    })
    .catch((e) => {
      toast.error(errorTitle, getErrorMessage(e));
      if (useCartStore.getState().token || key[1] !== "guest") qc.invalidateQueries({ queryKey: key });
      else qc.setQueryData(key, previous ?? EMPTY_CART);
    });
}

/** Id serveur d'une ligne : connu tout de suite, ou relu dans le cache une fois l'ajout en attente confirmé. */
function lineId(qc: QueryClient, productId: number, variantId: number | null) {
  const find = () => qc.getQueryData<Cart>(cartKeys.owner(currentCartOwner()))?.items.find((i) => same(i, productId, variantId))?.id;
  const known = find();
  return () => {
    const id = known && known > 0 ? known : find();
    return id && id > 0 ? id : null;
  };
}

/** Panier serveur (source de vérité : prix, stock, code promo), mis en cache par React Query. */
export function useCartQuery() {
  const userId = useAuthStore((s) => s.user?.id);
  const ready = useAuthStore((s) => s.ready);
  const token = useCartStore((s) => s.token);
  return useQuery({
    queryKey: cartKeys.owner(userId ? `u:${userId}` : "guest"),
    queryFn: cartService.get,
    // connecté : on attend la fusion du panier invité (CartOwnerSync) ; invité : rien à charger sans jeton
    enabled: ready && (userId ? !token : !!token),
    staleTime: 30_000,
  });
}

/** Panier : mises à jour optimistes (badge, toasts immédiats) synchronisées avec l'API. */
export function useCart() {
  const qc = useQueryClient();
  const { data, isLoading } = useCartQuery();
  const items = data?.items ?? [];

  const add = useCallback(
    (
      product: Product | CartProduct,
      quantity = 1,
      opts?: { silent?: boolean; variantId?: number | null; variantLabel?: string | null; /** écart de prix de la variante vs produit (appliqué au prix normal et soldé) */ priceDelta?: number },
    ) => {
      cartService.remember(product);
      const base = toCartProduct(product);
      const d = opts?.priceDelta ?? 0;
      const priced = d ? { ...base, price: base.price + d, priceSolde: base.priceSolde != null ? base.priceSolde + d : null } : base;
      const variantId = opts?.variantId ?? null;
      write(
        qc,
        (cart) => {
          const existing = cart.items.find((i) => same(i, product.id, variantId));
          const next = existing
            ? cart.items.map((i) => (i === existing ? { ...i, quantity: i.quantity + quantity } : i))
            : [...cart.items, { id: -Date.now(), productId: product.id, quantity, product: priced, variantId, variantLabel: opts?.variantLabel ?? null, available: true }];
          return { ...cart, items: next };
        },
        () => cartService.add(product.id, quantity, variantId),
        "Ajout au panier impossible",
      );
      useCartStore.getState().bump();
      if (!opts?.silent) toast.success("Ajouté au panier", opts?.variantLabel ? `${product.name} — ${opts.variantLabel}` : product.name);
    },
    [qc],
  );

  const remove = useCallback(
    (productId: number, variantId: number | null = null) => {
      const id = lineId(qc, productId, variantId);
      write(
        qc,
        (cart) => ({ ...cart, items: cart.items.filter((i) => !same(i, productId, variantId)) }),
        () => {
          const target = id();
          return target ? cartService.remove(target) : cartService.get();
        },
        "Impossible de retirer l'article",
      );
    },
    [qc],
  );

  const setQuantity = useCallback(
    (productId: number, quantity: number, variantId: number | null = null) => {
      if (quantity <= 0) return remove(productId, variantId);
      const id = lineId(qc, productId, variantId);
      write(
        qc,
        (cart) => ({ ...cart, items: cart.items.map((i) => (same(i, productId, variantId) ? { ...i, quantity } : i)) }),
        () => {
          const target = id();
          return target ? cartService.update(target, quantity) : cartService.get();
        },
        "Quantité non mise à jour",
      );
    },
    [qc, remove],
  );

  const clear = useCallback(() => {
    write(qc, (cart) => ({ ...cart, items: [] }), cartService.clear, "Impossible de vider le panier");
  }, [qc]);

  return {
    items,
    /** Totaux serveur (sous-total, code promo, livraison) — null tant que le panier n'existe pas côté API. */
    quote: data?.quote ?? null,
    isLoading,
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
