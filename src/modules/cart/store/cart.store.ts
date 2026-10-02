"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { unitPrice, type CartItem, type CartProduct } from "../types";

/** Propriétaire du panier : "guest" (anonyme) ou "u:<id>" (utilisateur connecté). */
export type CartOwner = "guest" | `u:${number}`;

interface CartState {
  owner: CartOwner;
  /** Paniers de tous les propriétaires (persistés) — un utilisateur retrouve SON panier sur son navigateur. */
  carts: Record<string, CartItem[]>;
  /** Panier du propriétaire courant. */
  items: CartItem[];
  /** Compteur incrémenté à chaque ajout : déclenche l'animation du badge header. */
  pulse: number;
  add: (product: CartProduct, quantity?: number, variantId?: number | null, variantLabel?: string | null) => void;
  setQuantity: (productId: number, quantity: number, variantId?: number | null) => void;
  remove: (productId: number, variantId?: number | null) => void;
  clear: () => void;
  replaceAll: (items: CartItem[]) => void;
  /**
   * Change de propriétaire. À la connexion (guest → utilisateur), le panier anonyme est FUSIONNÉ
   * dans celui de l'utilisateur. Retourne le nombre d'articles fusionnés.
   */
  switchOwner: (next: CartOwner) => number;
}

const same = (a: CartItem, productId: number, variantId?: number | null) => a.productId === productId && (a.variantId ?? null) === (variantId ?? null);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      owner: "guest",
      carts: {},
      items: [],
      pulse: 0,
      add: (product, quantity = 1, variantId = null, variantLabel = null) =>
        set((s) => {
          const existing = s.items.find((i) => same(i, product.id, variantId));
          const items = existing
            ? s.items.map((i) => (same(i, product.id, variantId) ? { ...i, quantity: i.quantity + quantity } : i))
            : [...s.items, { productId: product.id, quantity, product, variantId, variantLabel }];
          return { items, pulse: s.pulse + 1 };
        }),
      setQuantity: (productId, quantity, variantId = null) =>
        set((s) => ({
          items: quantity <= 0 ? s.items.filter((i) => !same(i, productId, variantId)) : s.items.map((i) => (same(i, productId, variantId) ? { ...i, quantity } : i)),
        })),
      remove: (productId, variantId = null) => set((s) => ({ items: s.items.filter((i) => !same(i, productId, variantId)) })),
      clear: () => set({ items: [] }),
      replaceAll: (items) => set({ items }),
      switchOwner: (next) => {
        const s = get();
        if (s.owner === next) return 0;
        const carts = { ...s.carts, [s.owner]: s.items };
        let items = [...(carts[next] ?? [])];
        let merged = 0;
        if (s.owner === "guest" && next !== "guest" && s.items.length) {
          for (const g of s.items) {
            const ex = items.find((i) => same(i, g.productId, g.variantId));
            if (ex) items = items.map((i) => (i === ex ? { ...i, quantity: i.quantity + g.quantity } : i));
            else items.push(g);
            merged += g.quantity;
          }
          carts.guest = [];
        }
        set({ owner: next, carts, items });
        return merged;
      },
    }),
    { name: "celebobo-cart-v2", partialize: (s) => ({ owner: s.owner, carts: s.carts, items: s.items }) },
  ),
);

/** Sélecteurs dérivés (utilisables hors composant). */
export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0);
export const cartSavings = (items: CartItem[]) => items.reduce((sum, i) => sum + (i.product.price - unitPrice(i)) * i.quantity, 0);
