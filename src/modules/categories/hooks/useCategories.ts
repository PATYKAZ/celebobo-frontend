"use client";

import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "../services/categories.service";

export const categoryKeys = {
  all: ["categories"] as const,
  detail: (id: number) => ["categories", id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: categoriesService.list,
    staleTime: 5 * 60_000,
  });
}

export function useCategory(id: number | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(id ?? 0),
    queryFn: () => categoriesService.detail(id as number),
    enabled: !!id,
  });
}
