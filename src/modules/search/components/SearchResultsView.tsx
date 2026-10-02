"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ProductListView } from "@/modules/products/components/ProductListView";
import { ProductGrid } from "@/modules/products/components/ProductGrid";
import { useProducts } from "@/modules/products/hooks/useProducts";

function PopularSuggestions() {
  const { data, isLoading } = useProducts({ ordering: "-sales", pageSize: 5 });
  return (
    <div className="mt-4 border-t border-line-3 pt-4 sm:mt-6 sm:pt-6">
      <SectionHeader title="Produits populaires" viewAllHref={ROUTES.products} />
      <ProductGrid products={data?.results} loading={isLoading} skeletons={5} columns={5} className="mt-4" />
    </div>
  );
}

function Inner() {
  const q = useSearchParams().get("q")?.trim() ?? "";
  return (
    <>
      <Breadcrumb items={[{ label: "Recherche" }]} />
      <Reveal>
        <Block pad="none" className="px-4 py-4 sm:px-[30px] sm:py-6">
          <h1 className="break-words text-[22px] leading-[28px] sm:text-h-page">
            {q ? (
              <>Résultats pour « <span className="rounded-md bg-primary-50 px-1.5 text-primary">{q}</span> »</>
            ) : (
              "Rechercher un produit"
            )}
          </h1>
          <p className="mt-1 text-[13px] text-ink-2 sm:text-[14px]">Affinez avec les filtres ou changez le tri.</p>
        </Block>
      </Reveal>
      <ProductListView emptyExtra={<PopularSuggestions />} />
    </>
  );
}

export function SearchResultsView() {
  return (
    <Suspense fallback={<Block><Skeleton className="h-[600px] w-full" /></Block>}>
      <Inner />
    </Suspense>
  );
}
