"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { productsService } from "../services/products.service";
import type { NewReviewInput, ProductListParams } from "../types";

export const productKeys = {
  all: ["products"] as const,
  list: (p: ProductListParams) => ["products", "list", p] as const,
  detail: (slug: string) => ["products", "detail", slug] as const,
  related: (slug: string) => ["products", "related", slug] as const,
  suggest: (q: string) => ["products", "suggest", q] as const,
  reviews: (slug: string) => ["products", "reviews", slug] as const,
  eligibility: (slug: string, userId?: number) => ["products", "can-review", slug, userId] as const,
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

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(slug ?? ""),
    queryFn: () => productsService.detail(slug as string),
    enabled: !!slug,
  });
}

export function useRelatedProducts(slug: string | undefined) {
  return useQuery({
    queryKey: productKeys.related(slug ?? ""),
    queryFn: () => productsService.related(slug as string),
    enabled: !!slug,
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

export function useProductReviews(slug: string | undefined) {
  return useQuery({
    queryKey: productKeys.reviews(slug ?? ""),
    queryFn: () => productsService.reviews(slug as string),
    enabled: !!slug,
  });
}

/** Droit de laisser un avis (acheteurs d'une commande livrée, un avis par produit). */
export function useReviewEligibility(slug: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: productKeys.eligibility(slug, userId),
    queryFn: () => productsService.reviewEligibility(slug),
    enabled: !!userId,
  });
}

export function useAddReview(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewReviewInput) => productsService.addReview(slug, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.reviews(slug) });
      qc.invalidateQueries({ queryKey: productKeys.detail(slug) });
      qc.invalidateQueries({ queryKey: ["products", "can-review", slug] });
    },
  });
}
