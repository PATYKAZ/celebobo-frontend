"use client";

import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { productsService } from "../services/products.service";
import { productKeys } from "../keys";
import type { NewReviewInput, ProductListParams } from "../types";

export { productKeys };

/** Liste paginée / filtrée. */
export function useProducts(params: ProductListParams = {}, enabled = true) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsService.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Listes boutique en défilement infini : lots de `pageSize` produits, le suivant chargé à l'approche du bas. */
export function useInfiniteProducts(params: Omit<ProductListParams, "page">, pageSize = 24) {
  return useInfiniteQuery({
    queryKey: [...productKeys.list({ ...params, pageSize }), "infinite"] as const,
    queryFn: ({ pageParam }) => productsService.list({ ...params, page: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (pages.length * pageSize < last.count ? pages.length + 1 : undefined),
    placeholderData: keepPreviousData,
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

/** Compteurs des filtres pour les filtres en cours (catégories, prix, en stock, en promotion). */
export function useProductFacets(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.facets({ ...params, page: undefined, pageSize: undefined, ordering: undefined }),
    queryFn: () => productsService.facets(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
