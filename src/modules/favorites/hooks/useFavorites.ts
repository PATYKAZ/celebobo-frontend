"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/config/routes";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { favoritesService } from "../services/favorites.service";
import { useFavoritesStore } from "../store/favorites.store";

const favoritesKey = (userId?: number) => ["favorites", userId] as const;

/** Favoris du compte connecté ; aligne les cœurs (store) sur la liste serveur. */
export function useFavoriteProducts() {
  const { user, ready } = useAuth();
  const query = useQuery({
    queryKey: favoritesKey(user?.id),
    queryFn: favoritesService.list,
    enabled: !!user,
  });

  useEffect(() => {
    if (query.data) useFavoritesStore.getState().replaceAll(query.data.map((p) => p.id));
  }, [query.data]);

  useEffect(() => {
    if (ready && !user) useFavoritesStore.getState().replaceAll([]);
  }, [ready, user]);

  return query;
}

/** Bascule optimiste d'un favori ; redirige vers la connexion si l'utilisateur est anonyme. */
export function useFavoriteToggle() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const ids = useFavoritesStore((s) => s.ids);
  useFavoriteProducts();

  const toggle = useCallback(
    async (productId: number, name?: string) => {
      if (!user) {
        toast.info("Connectez-vous pour gérer vos favoris");
        router.push(ROUTES.login(window.location.pathname));
        return;
      }
      const store = useFavoritesStore.getState();
      const next = !store.has(productId);
      store.set(productId, next); // optimiste
      toast[next ? "success" : "info"](next ? "Ajouté aux favoris" : "Retiré des favoris", name);
      try {
        await (next ? favoritesService.add(productId) : favoritesService.remove(productId));
        qc.invalidateQueries({ queryKey: favoritesKey(user.id) });
      } catch {
        useFavoritesStore.getState().set(productId, !next); // rollback
        toast.error("Impossible de mettre à jour vos favoris");
      }
    },
    [user, router, qc],
  );

  return { ids, isFavorite: (id: number) => ids.includes(id), toggle };
}
