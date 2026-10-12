"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHydrationSafe } from "@/shared/hooks/useHydrationSafe";
import { categoryKeys } from "../keys";
import { flattenCategories } from "../services/categories.mapper";
import { categoriesService } from "../services/categories.service";

export { categoryKeys };

/**
 * Catégories principales de la boutique, chacune avec ses sous-catégories (`children`), fournies par le serveur (layout boutique) : le menu est dans le HTML.
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

/**
 * Toutes les catégories à plat (principales puis leurs sous-catégories) : listes déroulantes, filtres,
 * recherche par slug. `useCategories` donne l'arbre (menus).
 */
export function useFlatCategories() {
  const query = useCategories();
  const data = useMemo(() => (query.data ? flattenCategories(query.data) : undefined), [query.data]);
  return { ...query, data };
}

export function useCategory(slug: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(slug ?? ""),
    queryFn: () => categoriesService.detail(slug as string),
    enabled: !!slug,
  });
}
