"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useCallback, useMemo, useOptimistic } from "react";
import type { ProductListParams, ProductOrdering } from "../types";

export const PAGE_SIZE = 12;
export const PRICE_MAX = 2500;

const FILTER_KEYS = ["page", "q", "category", "ordering", "minPrice", "maxPrice", "onSale", "inStock"];
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

  const urlState = useMemo<ProductFilterState>(() => {
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

  // l'interface (cases, curseur, catégorie) reflète le choix tout de suite, sans attendre la navigation
  const [state, applyOptimistic] = useOptimistic(urlState, (current, patch: Partial<ProductFilterState>) => ({ ...current, ...patch }));

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
      // tout changement de filtre (hors page) revient à la page 1
      const merged: Partial<ProductFilterState> = "page" in patch ? patch : { ...patch, page: 1 };
      // construit depuis l'état optimiste (et non l'URL) : deux clics rapides ne s'écrasent plus
      const target = { ...state, ...merged };
      // paramètres étrangers aux filtres (utm_…) conservés
      const next = new URLSearchParams(sp.toString());
      for (const k of FILTER_KEYS) next.delete(k);
      const put = (k: string, v: string | number | boolean | null | undefined) => {
        if (v !== null && v !== undefined && v !== "" && v !== false) next.set(k, v === true ? "1" : String(v));
      };
      put("page", target.page > 1 ? target.page : null);
      if (locked.q === undefined) put("q", target.q);
      if (locked.category === undefined) put("category", target.category);
      put("ordering", target.ordering === "-created_at" ? null : target.ordering);
      put("minPrice", target.minPrice);
      put("maxPrice", target.maxPrice);
      put("onSale", target.onSale);
      put("inStock", target.inStock);
      const qs = next.toString();
      startTransition(() => {
        applyOptimistic(merged);
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [router, pathname, sp, state, locked.q, locked.category, applyOptimistic],
  );

  const reset = useCallback(() => {
    const next = new URLSearchParams();
    if (locked.q === undefined && sp.get("q")) next.set("q", sp.get("q") as string);
    const qs = next.toString();
    startTransition(() => {
      applyOptimistic({ page: 1, category: locked.category ?? null, ordering: "-created_at", minPrice: null, maxPrice: null, onSale: false, inStock: false });
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }, [router, pathname, sp, locked.q, locked.category, applyOptimistic]);

  const activeCount =
    (state.minPrice != null ? 1 : 0) +
    (state.maxPrice != null ? 1 : 0) +
    (state.onSale ? 1 : 0) +
    (state.inStock ? 1 : 0) +
    (locked.category === undefined && state.category ? 1 : 0);

  return { state, params, set, reset, activeCount };
}
