"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { ProductListParams, ProductOrdering } from "../types";

export const PAGE_SIZE = 12;
export const PRICE_MAX = 2500;

const ORDERINGS: ProductOrdering[] = ["-created_at", "created_at", "price", "-price", "-sales", "-rating", "name"];

export interface ProductFilterState {
  page: number;
  q: string;
  /** slug de catégorie */
  category: string | null;
  ordering: ProductOrdering;
  minPrice: number | null;
  maxPrice: number | null;
  onSale: boolean;
  inStock: boolean;
}

export interface LockedFilters {
  category?: string;
  q?: string;
}

/**
 * Filtres de liste synchronisés avec l'URL (?page=&q=&category=&ordering=&minPrice=&maxPrice=&onSale=&inStock=).
 * `locked` impose des valeurs (page catégorie / recherche) non modifiables par l'utilisateur.
 */
export function useProductFilters(locked: LockedFilters = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const state = useMemo<ProductFilterState>(() => {
    const num = (k: string) => {
      const v = sp.get(k);
      return v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null;
    };
    const ord = sp.get("ordering") as ProductOrdering | null;
    return {
      page: Math.max(1, num("page") ?? 1),
      q: locked.q ?? sp.get("q") ?? "",
      category: locked.category ?? (sp.get("category") || null),
      ordering: ord && ORDERINGS.includes(ord) ? ord : "-created_at",
      minPrice: num("minPrice"),
      maxPrice: num("maxPrice"),
      onSale: sp.get("onSale") === "1",
      inStock: sp.get("inStock") === "1",
    };
  }, [sp, locked.category, locked.q]);

  const params = useMemo<ProductListParams>(
    () => ({
      page: state.page,
      pageSize: PAGE_SIZE,
      search: state.q || undefined,
      category: state.category,
      ordering: state.ordering,
      minPrice: state.minPrice ?? undefined,
      maxPrice: state.maxPrice ?? undefined,
      onSale: state.onSale || undefined,
      inStock: state.inStock || undefined,
    }),
    [state],
  );

  const set = useCallback(
    (patch: Partial<ProductFilterState>) => {
      const next = new URLSearchParams(sp.toString());
      const apply = (k: string, v: string | number | boolean | null | undefined) => {
        if (v === null || v === undefined || v === "" || v === false) next.delete(k);
        else next.set(k, v === true ? "1" : String(v));
      };
      const merged = { ...patch };
      // tout changement de filtre (hors page) revient à la page 1
      if (!("page" in patch)) merged.page = 1;
      if ("page" in merged) apply("page", merged.page && merged.page > 1 ? merged.page : null);
      if ("q" in merged && locked.q === undefined) apply("q", merged.q);
      if ("category" in merged && locked.category === undefined) apply("category", merged.category);
      if ("ordering" in merged) apply("ordering", merged.ordering === "-created_at" ? null : merged.ordering);
      if ("minPrice" in merged) apply("minPrice", merged.minPrice);
      if ("maxPrice" in merged) apply("maxPrice", merged.maxPrice);
      if ("onSale" in merged) apply("onSale", merged.onSale);
      if ("inStock" in merged) apply("inStock", merged.inStock);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, sp, locked.q, locked.category],
  );

  const reset = useCallback(() => {
    const next = new URLSearchParams();
    if (locked.q === undefined && sp.get("q")) next.set("q", sp.get("q") as string);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, sp, locked.q]);

  const activeCount =
    (state.minPrice != null ? 1 : 0) +
    (state.maxPrice != null ? 1 : 0) +
    (state.onSale ? 1 : 0) +
    (state.inStock ? 1 : 0) +
    (locked.category === undefined && state.category ? 1 : 0);

  return { state, params, set, reset, activeCount };
}
