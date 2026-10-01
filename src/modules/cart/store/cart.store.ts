"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { unitPrice, type CartItem, type CartProduct } from "../types";

interface CartState {
  items: CartItem[];
  /** Compteur incrémenté à chaque ajout : déclenche l'animation du badge header. */
  pulse: number;
  add: (product: CartProduct, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  replaceAll: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      pulse: 0,
      add: (product, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === product.id);
          const items = existing
            ? s.items.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i))
            : [...s.items, { productId: product.id, quantity, product }];
          return { items, pulse: s.pulse + 1 };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      replaceAll: (items) => set({ items }),
    }),
    { name: "celebobo-cart", partialize: (s) => ({ items: s.items }) },
  ),
);

/** Sélecteurs dérivés (utilisables hors composant). */
export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0);
export const cartSavings = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + (i.product.price - unitPrice(i)) * i.quantity, 0);
