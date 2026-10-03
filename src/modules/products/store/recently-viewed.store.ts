"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../types";

/** Mini-instantané suffisant pour afficher la carte « récemment consultés ». */
export type ViewedProduct = Pick<Product, "id" | "slug" | "name" | "image" | "price" | "priceSolde" | "rating" | "reviewsCount" | "currentBadge" | "category">;

interface State {
  items: ViewedProduct[];
  track: (p: Product | ViewedProduct) => void;
  clear: () => void;
}

const MAX = 12;

/** Produits récemment consultés (le plus récent en premier). Appeler `track(product)` sur la fiche produit. */
export const useRecentlyViewedStore = create<State>()(
  persist(
    (set) => ({
      items: [],
      track: (p) =>
        set((s) => {
          const snap: ViewedProduct = {
            id: p.id,
            slug: p.slug,
            name: p.name,
            image: p.image,
            price: p.price,
            priceSolde: p.priceSolde,
            rating: p.rating,
            reviewsCount: p.reviewsCount,
            currentBadge: p.currentBadge,
            category: p.category,
          };
          return { items: [snap, ...s.items.filter((i) => i.id !== p.id)].slice(0, MAX) };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "celebobo-recently-viewed",
      version: 2,
      // v1 (ids de démo, sans slug) : on repart d'une liste vide
      migrate: () => ({ items: [] }),
    },
  ),
);
