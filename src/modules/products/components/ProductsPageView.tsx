"use client";

import { Suspense } from "react";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ProductListView } from "./ProductListView";

/** Page « Tous les produits ». */
export function ProductsPageView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Produits" }]} />
      <Reveal>
        <Block pad="none" className="flex flex-wrap items-end justify-between gap-2 px-5 py-6 sm:px-[30px]">
          <div>
            <h1 className="text-h-page">Tous les produits</h1>
            <p className="mt-1 text-[14px] text-ink-2">Smartphones, ordinateurs, audio, gaming et accessoires — sélectionnés par Celebobo.</p>
          </div>
        </Block>
      </Reveal>
      <Suspense fallback={<Block><Skeleton className="h-[600px] w-full" /></Block>}>
        <ProductListView />
      </Suspense>
    </>
  );
}
