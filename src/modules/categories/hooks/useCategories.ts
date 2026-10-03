"use client";

import { useQuery } from "@tanstack/react-query";
import { useHydrated } from "@/shared/hooks/useHydrated";
import { categoriesService } from "../services/categories.service";

export const categoryKeys = {
  all: ["categories"] as const,
  detail: (slug: string) => ["categories", slug] as const,
};

/**
 * Catégories de la boutique. Partagées par l'en-tête et les pages : le cache peut être rempli avant
 * l'hydratation d'une section, qui doit d'abord rendre comme le serveur (squelette).
 */
export function useCategories() {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: categoryKeys.all,
    queryFn: categoriesService.list,
    staleTime: 5 * 60_000,
  });
  return hydrated ? query : { ...query, data: undefined, isLoading: true };
}

export function useCategory(slug: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(slug ?? ""),
    queryFn: () => categoriesService.detail(slug as string),
    enabled: !!slug,
  });
}
