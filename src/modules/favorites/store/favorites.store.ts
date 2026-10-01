"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  ids: number[];
  has: (id: number) => boolean;
  set: (id: number, on: boolean) => void;
  replaceAll: (ids: number[]) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      has: (id) => get().ids.includes(id),
      set: (id, on) =>
        set((s) => ({ ids: on ? (s.ids.includes(id) ? s.ids : [...s.ids, id]) : s.ids.filter((x) => x !== id) })),
      replaceAll: (ids) => set({ ids }),
    }),
    { name: "celebobo-favorites", partialize: (s) => ({ ids: s.ids }) },
  ),
);
