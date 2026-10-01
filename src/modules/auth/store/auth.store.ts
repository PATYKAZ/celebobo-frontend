"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  /** true une fois la session vérifiée (me()) ou la persistance réhydratée. */
  ready: boolean;
  setUser: (user: User | null) => void;
  patchUser: (patch: Partial<User>) => void;
  setReady: (ready: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      ready: false,
      setUser: (user) => set({ user, ready: true }),
      patchUser: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
      setReady: (ready) => set({ ready }),
    }),
    {
      name: "celebobo-auth",
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => state?.setReady(true),
    },
  ),
);
