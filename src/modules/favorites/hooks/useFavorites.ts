"use client";

import { useCallback, useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/config/routes";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { favoritesService } from "../services/favorites.service";
import { useFavoritesStore } from "../store/favorites.store";
import { useAppRouter } from "@/shared/hooks/useAppRouter";

const favoritesKeys = {
  all: (userId?: number) => ["favorites", userId] as const,
  ids: (userId?: number) => ["favorites", userId, "ids"] as const,
  list: (userId?: number) => ["favorites", userId, "list"] as const,
};

/** Identifiants des favoris du compte connecté ; aligne les cœurs (store) sur le serveur. */
function useFavoriteIds() {
  const { user, ready } = useAuth();
  const query = useQuery({
    queryKey: favoritesKeys.ids(user?.id),
    queryFn: favoritesService.ids,
    enabled: !!user,
  });

  useEffect(() => {
    if (query.data) useFavoritesStore.getState().replaceAll(query.data);
  }, [query.data]);

  useEffect(() => {
    if (ready && !user) useFavoritesStore.getState().replaceAll([]);
  }, [ready, user]);

  return query;
}

/** Bascule optimiste d'un favori ; redirige vers la connexion si l'utilisateur est anonyme. */
export function useFavoriteToggle() {
  const router = useAppRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const ids = useFavoritesStore((s) => s.ids);
  useFavoriteIds();

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
        qc.invalidateQueries({ queryKey: favoritesKeys.all(user.id) });
      } catch {
        useFavoritesStore.getState().set(productId, !next); // rollback
        toast.error("Impossible de mettre à jour vos favoris");
      }
    },
    [user, router, qc],
  );

  return { ids, isFavorite: (id: number) => ids.includes(id), toggle };
}

/** Cartes des favoris (page « Mes favoris »), par pages de 48. */
export function useFavoriteProducts() {
  const { user } = useAuth();
  useFavoriteIds();
  return useInfiniteQuery({
    queryKey: favoritesKeys.list(user?.id),
    queryFn: ({ pageParam }) => favoritesService.list(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, _all, page) => (last.next ? page + 1 : undefined),
    enabled: !!user,
  });
}
