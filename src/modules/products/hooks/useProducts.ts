"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsService } from "../services/products.service";
import type { NewReviewInput, ProductListParams } from "../types";

export const productKeys = {
  all: ["products"] as const,
  list: (p: ProductListParams) => ["products", "list", p] as const,
  detail: (id: number) => ["products", "detail", id] as const,
  related: (id: number) => ["products", "related", id] as const,
  suggest: (q: string) => ["products", "suggest", q] as const,
  reviews: (id: number) => ["products", "reviews", id] as const,
};

/** Liste paginée / filtrée. */
export function useProducts(params: ProductListParams = {}, enabled = true) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsService.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? 0),
    queryFn: () => productsService.detail(id as number),
    enabled: !!id,
  });
}

export function useRelatedProducts(id: number | undefined) {
  return useQuery({
    queryKey: productKeys.related(id ?? 0),
    queryFn: () => productsService.related(id as number),
    enabled: !!id,
  });
}

export function useProductSuggestions(q: string) {
  return useQuery({
    queryKey: productKeys.suggest(q),
    queryFn: () => productsService.suggest(q),
    enabled: q.trim().length >= 2,
    staleTime: 60_000,
  });
}

export function useProductReviews(id: number | undefined) {
  return useQuery({
    queryKey: productKeys.reviews(id ?? 0),
    queryFn: () => productsService.reviews(id as number),
    enabled: !!id,
  });
}

export function useAddReview(productId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, author }: { input: NewReviewInput; author?: { id: number; name: string; avatar: string | null } }) =>
      productsService.addReview(productId, input, author),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.reviews(productId) });
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}
