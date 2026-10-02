"use client";

import { SearchStatus } from "iconsax-reactjs";
import { AnimatePresence } from "motion/react";
import { useState, type ReactNode } from "react";
import { RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Pagination } from "@/shared/ui/Pagination";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { PAGE_SIZE, useProductFilters, type LockedFilters } from "../hooks/useProductFilters";
import { useProducts } from "../hooks/useProducts";
import { ProductFilters } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";
import { ProductListItem } from "./ProductListItem";
import { ProductToolbar, type ViewMode } from "./ProductToolbar";

interface Props {
  locked?: LockedFilters;
  /** Affiché sous la liste quand aucun résultat (ex: suggestions). */
  emptyExtra?: ReactNode;
}

/** Liste filtrable (sidebar + barre d'outils + grille/liste + pagination), partagée par produits / catégorie / recherche. */
export function ProductListView({ locked, emptyExtra }: Props) {
  const { state, params, set, reset, activeCount } = useProductFilters(locked);
  const { data: categories } = useCategories();
  const { data, isLoading, isFetching } = useProducts(params);
  const [view, setView] = useState<ViewMode>("grid");
  const [drawer, setDrawer] = useState(false);

  const total = data?.count;
  const pageCount = Math.ceil((total ?? 0) / PAGE_SIZE);
  const hideCats = locked?.category !== undefined;
  const filters = (
    <ProductFilters state={state} categories={categories} hideCategories={hideCats} onChange={set} onReset={reset} activeCount={activeCount} />
  );

  return (
    <Block pad="none" className="grid grid-cols-[minmax(0,1fr)] gap-0 p-3 sm:p-[30px] lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-4">{filters}</div>
      </aside>

      <BottomSheet open={drawer} onClose={() => setDrawer(false)} title="Filtres" maxVh={90}>
        <div className="pt-1">{filters}</div>
        {/* actions collées en bas de la feuille */}
        <div className="sticky bottom-0 -mx-5 mt-3 flex gap-2.5 border-t border-line-3 bg-white px-5 pb-safe pt-3">
          {activeCount > 0 && (
            <Button variant="chip" onClick={reset} upper={false} className="shrink-0">
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

        <div className={isFetching && !isLoading ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
          {isLoading ? (
            <ProductGrid loading skeletons={PAGE_SIZE} columns={4} className="mt-3" />
          ) : data && data.results.length > 0 ? (
            view === "grid" ? (
              <ProductGrid key={`${state.page}-${state.ordering}`} products={data.results} columns={4} className="mt-3" />
            ) : (
              <RevealGroup key={`l-${state.page}-${state.ordering}`} stagger={0.05} className="mt-3 flex flex-col divide-y divide-line-3">
                <AnimatePresence>
                  {data.results.map((p) => (
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
                action={activeCount > 0 ? <Button onClick={reset} variant="outline" upper={false}>Réinitialiser les filtres</Button> : undefined}
              />
              {emptyExtra}
            </>
          )}
        </div>

        <Pagination
          page={state.page}
          pageCount={pageCount}
          onChange={(p) => {
            set({ page: p });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="pt-6 sm:pt-8"
        />
      </div>
    </Block>
  );
}
