"use client";

import { SearchStatus } from "@/shared/ui/icons";
import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { useFlatCategories } from "@/modules/categories/hooks/useCategories";
import { useProductFilters, type LockedFilters } from "../hooks/useProductFilters";
import { useInfiniteProducts, useProductFacets } from "../hooks/useProducts";
import { ProductFilters } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";
import { ProductListItem } from "./ProductListItem";
import { ProductToolbar, type ViewMode } from "./ProductToolbar";

interface Props {
  locked?: LockedFilters;
  /** Affiché sous la liste quand aucun résultat (ex: suggestions). */
  emptyExtra?: ReactNode;
}

/**
 * Liste filtrable (sidebar + barre d'outils + grille/liste), partagée par produits / catégorie / recherche.
 * Défilement infini : le lot suivant se charge à l'approche du bas (plus de pagination numérotée).
 */
const BATCH = 24;

export function ProductListView({ locked, emptyExtra }: Props) {
  const { state, params, set, reset, activeCount } = useProductFilters(locked);
  const { data: categories } = useFlatCategories();
  // la page de l'URL ne sert plus : on charge par lots successifs
  const { page: _page, pageSize: _size, ...listParams } = params;
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteProducts(listParams, BATCH);
  const products = useMemo(() => data?.pages.flatMap((pg) => pg.results) ?? [], [data]);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const { data: facets } = useProductFacets(params);
  const [view, setView] = useState<ViewMode>("grid");
  const [drawer, setDrawer] = useState(false);

  const total = data?.pages[0]?.count;
  const hideCats = locked?.category !== undefined;
  const filters = (
    <ProductFilters state={state} categories={categories} facets={facets} hideCategories={hideCats} onChange={set} onReset={reset} activeCount={activeCount} />
  );

  return (
    <Block pad="none" className="grid grid-cols-[minmax(0,1fr)] gap-0 p-3 sm:p-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-4">{filters}</div>
      </aside>

      <BottomSheet open={drawer} onClose={() => setDrawer(false)} title="Filtres" maxVh={90}>
        <div className="pt-1">{filters}</div>
        {/* actions collées en bas de la feuille */}
        <div className="sticky bottom-0 -mx-5 mt-3 flex gap-2.5 border-t border-line-3 bg-surface px-5 pb-safe pt-3">
          {activeCount > 0 && (
            <Button variant="secondary" onClick={reset} upper={false} className="shrink-0">
              Réinitialiser
            </Button>
          )}
          <Button fullWidth onClick={() => setDrawer(false)} upper={false}>
            Voir {total != null ? `${total} résultat${total > 1 ? "s" : ""}` : "les résultats"}
          </Button>
        </div>
      </BottomSheet>

      <div className="min-w-0">
        <ProductToolbar
          total={total}
          loading={isLoading}
          ordering={state.ordering}
          onOrderingChange={(ordering) => set({ ordering })}
          view={view}
          onViewChange={setView}
          onOpenFilters={() => setDrawer(true)}
          activeFilters={activeCount}
        />

        <div className={isFetching && !isLoading && !isFetchingNextPage ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
          {isLoading ? (
            <ProductGrid loading skeletons={10} columns={4} className="mt-3" />
          ) : products.length > 0 ? (
            view === "grid" ? (
              <ProductGrid key={state.ordering} products={products} columns={4} className="mt-3" />
            ) : (
              <RevealGroup key={`l-${state.ordering}`} stagger={0.05} className="mt-3 flex flex-col divide-y divide-line-3">
                <AnimatePresence>
                  {products.map((p) => (
                    <RevealItem key={p.id}>
                      <ProductListItem product={p} />
                    </RevealItem>
                  ))}
                </AnimatePresence>
              </RevealGroup>
            )
          ) : (
            <>
              <EmptyState
                icon={<SearchStatus size={44} variant="Bulk" />}
                title="Aucun produit trouvé"
                description="Essayez d'élargir votre recherche ou de retirer certains filtres."
                action={activeCount > 0 ? <Button onClick={reset} variant="secondary" upper={false}>Réinitialiser les filtres</Button> : undefined}
              />
              {emptyExtra}
            </>
          )}
        </div>

        {/* repère de chargement du lot suivant + état de la liste */}
        <div ref={sentinel} aria-hidden className="h-px" />
        {isFetchingNextPage && <ProductGrid loading skeletons={5} columns={4} className="mt-1" />}
        {products.length > 0 && total != null && (
          <p className="py-5 text-center text-sm text-ink-3" aria-live="polite">
            {hasNextPage ? `${products.length} sur ${total} produits` : `${total} produit${total > 1 ? "s" : ""} — vous avez tout vu`}
          </p>
        )}
      </div>
    </Block>
  );
}
