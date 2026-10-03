"use client";

import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "../services/categories.service";

export const categoryKeys = {
  all: ["categories"] as const,
  detail: (slug: string) => ["categories", slug] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: categoriesService.list,
    staleTime: 5 * 60_000,
  });
}

export function useCategory(slug: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(slug ?? ""),
    queryFn: () => categoriesService.detail(slug as string),
    enabled: !!slug,
  });
}
