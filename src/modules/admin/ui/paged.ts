"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/shared/lib/api";

/** Page de l'API (`results` + `meta`). */
export interface ApiPage<T> {
  results: T[];
  meta: { count: number; page: number; pageSize: number; totalPages: number };
}

/** Liste paginée d'un écran d'administration ; les filtres vides ne sont pas envoyés. */
export function useAdminPage<T>(key: string, url: string, filters: Record<string, string | number | boolean | undefined>, page: number, pageSize = 20) {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ""));
  return useQuery({
    queryKey: ["admin", key, params, page],
    queryFn: () => api.get<ApiPage<T>>(url, { params: { ...params, page, pageSize } }),
    placeholderData: keepPreviousData,
  });
}
