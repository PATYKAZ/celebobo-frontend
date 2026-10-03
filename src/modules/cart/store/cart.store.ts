"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { unitPrice, type CartItem } from "../types";

interface CartState {
  /** Jeton du panier invité (`X-Cart-Token`), conservé dans le navigateur jusqu'à la fusion à la connexion. */
  token: string | null;
  /** Compteur incrémenté à chaque ajout : déclenche l'animation du badge header. */
  pulse: number;
  setToken: (token: string | null) => void;
  bump: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      token: null,
      pulse: 0,
      setToken: (token) => set({ token }),
      bump: () => set((s) => ({ pulse: s.pulse + 1 })),
    }),
    { name: "celebobo-cart-v4", partialize: (s) => ({ token: s.token }) },
  ),
);

/** Sélecteurs dérivés (utilisables hors composant) — seules les lignes disponibles comptent dans les totaux. */
const sellable = (items: CartItem[]) => items.filter((i) => i.available !== false);
export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartTotal = (items: CartItem[]) => sellable(items).reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0);
export const cartSavings = (items: CartItem[]) => sellable(items).reduce((sum, i) => sum + (i.product.price - unitPrice(i)) * i.quantity, 0);
