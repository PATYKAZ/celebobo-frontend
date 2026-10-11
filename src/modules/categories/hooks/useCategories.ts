"use client";

import { useQuery } from "@tanstack/react-query";
import { useHydrationSafe } from "@/shared/hooks/useHydrationSafe";
import { categoryKeys } from "../keys";
import { categoriesService } from "../services/categories.service";

export { categoryKeys };

/**
 * Catégories de la boutique, fournies par le serveur (layout boutique) : le menu est dans le HTML.
 * Sans données serveur (API injoignable), squelette jusqu'à l'hydratation (cf. useHydrationSafe).
 */
export function useCategories() {
  const query = useQuery({
    queryKey: categoryKeys.all,
    queryFn: categoriesService.list,
    staleTime: 5 * 60_000,
  });
  const data = useHydrationSafe(categoryKeys.all, query.data);
  // donnée masquée le temps de l'hydratation : présentée comme un chargement (squelette)
  return data === undefined && query.data !== undefined ? { ...query, data, isLoading: true } : query;
}

export function useCategory(slug: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(slug ?? ""),
    queryFn: () => categoriesService.detail(slug as string),
    enabled: !!slug,
  });
}
