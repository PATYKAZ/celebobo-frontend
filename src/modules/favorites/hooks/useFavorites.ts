"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/config/env";
import { ROUTES } from "@/config/routes";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { favoritesService } from "../services/favorites.service";
import { useFavoritesStore } from "../store/favorites.store";

/** Bascule optimiste d'un favori ; redirige vers la connexion si l'API est réelle et l'utilisateur anonyme. */
export function useFavoriteToggle() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const ids = useFavoritesStore((s) => s.ids);

  const toggle = useCallback(
    async (productId: number, name?: string) => {
      if (!env.USE_MOCKS && !isAuthenticated) {
        toast.info("Connectez-vous pour gérer vos favoris");
        router.push(ROUTES.login(window.location.pathname));
        return;
      }
      const store = useFavoritesStore.getState();
      const next = !store.has(productId);
      store.set(productId, next); // optimiste
      toast[next ? "success" : "info"](next ? "Ajouté aux favoris" : "Retiré des favoris", name);
      try {
        const res = await favoritesService.toggle(productId);
        if (!env.USE_MOCKS) useFavoritesStore.getState().set(productId, res.isFavorite);
      } catch {
        useFavoritesStore.getState().set(productId, !next); // rollback
        toast.error("Impossible de mettre à jour vos favoris");
      }
    },
    [isAuthenticated, router],
  );

  return { ids, isFavorite: (id: number) => ids.includes(id), toggle };
}

export function useFavoriteProducts() {
  const ids = useFavoritesStore((s) => s.ids);
  return useQuery({
    queryKey: ["favorites", env.USE_MOCKS ? ids : "server"],
    queryFn: () => favoritesService.list(ids),
  });
}
