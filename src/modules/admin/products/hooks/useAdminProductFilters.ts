"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { AdminProductListParams, ProductStatusFilter } from "../types";

export const PAGE_SIZE = 10;

/** Filtres de la liste admin synchronisés avec l'URL (lien partageable, retour navigateur conservé). */
export function useAdminProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const params = useMemo<AdminProductListParams & { page: number; status: ProductStatusFilter }>(() => {
    const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);
    return {
      page: Number(sp.get("page")) || 1,
      pageSize: PAGE_SIZE,
      search: sp.get("q") ?? "",
      category: num("cat") ?? null,
      onSale: sp.get("sale") === "1",
      outOfStock: sp.get("out") === "1",
      lowStock: sp.get("low") === "1",
      status: sp.get("status") === "trash" ? "trash" : "active",
      badge: sp.get("badge") ?? undefined,
      minPrice: num("min"),
      maxPrice: num("max"),
      minDiscount: num("disc"),
    };
  }, [sp]);

  /** Met à jour un ou plusieurs filtres (valeur vide/false/undefined => retiré). La page repart à 1 sauf si `page` est fourni. */
  const set = useCallback(
    (patch: Record<string, string | number | boolean | null | undefined>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === "" || v === false) next.delete(k);
        else next.set(k, v === true ? "1" : String(v));
      }
      if (!("page" in patch)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [sp, router, pathname],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);
  const activeCount = ["cat", "sale", "out", "low", "badge", "min", "max", "disc"].filter((k) => sp.has(k)).length;

  return { params, set, reset, activeCount };
}
