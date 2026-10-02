"use client";

import { useRef } from "react";
import { ROUTES } from "@/config/routes";
import { Block } from "@/shared/ui/Block";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { SliderArrows } from "@/shared/ui/SliderArrows";
import { ProductCardSkeleton } from "@/shared/ui/Skeleton";
import { Reveal } from "@/shared/animations/Reveal";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { useProducts } from "@/modules/products/hooks/useProducts";

/** Carrousel « Vous aimerez aussi » (défilement horizontal avec snap + flèches). */
export function RecommendedProducts({ excludeIds = [] }: { excludeIds?: number[] }) {
  const { data, isLoading } = useProducts({ ordering: "-sales", pageSize: 12 });
  const track = useRef<HTMLDivElement>(null);
  const items = data?.results.filter((p) => !excludeIds.includes(p.id)).slice(0, 8);
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * 480, behavior: "smooth" });

  return (
    <Reveal>
      <Block pad="none" className="p-4 sm:p-[30px]">
        <SectionHeader title="Vous aimerez aussi" viewAllHref={ROUTES.products} right={<SliderArrows onPrev={() => scroll(-1)} onNext={() => scroll(1)} className="max-sm:hidden" />} />
        <div ref={track} className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 sm:-mx-2 sm:mt-6 sm:scroll-px-2 sm:gap-1 sm:px-2">
          {isLoading
            ? Array.from({ length: 5 }, (_, i) => <div key={i} className="w-[168px] shrink-0 sm:w-[224px]"><ProductCardSkeleton /></div>)
            : items?.map((p) => (
                <div key={p.id} className="w-[168px] shrink-0 snap-start sm:w-[224px]">
                  <ProductCard product={p} />
                </div>
              ))}
        </div>
      </Block>
    </Reveal>
  );
}
