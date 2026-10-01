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
      <Block>
        <SectionHeader title="Vous aimerez aussi" viewAllHref={ROUTES.products} right={<SliderArrows onPrev={() => scroll(-1)} onNext={() => scroll(1)} />} />
        <div ref={track} className="no-scrollbar -mx-2 mt-6 flex snap-x snap-mandatory gap-1 overflow-x-auto px-2">
          {isLoading
            ? Array.from({ length: 5 }, (_, i) => <div key={i} className="w-[224px] shrink-0"><ProductCardSkeleton /></div>)
            : items?.map((p) => (
                <div key={p.id} className="w-[224px] shrink-0 snap-start">
                  <ProductCard product={p} />
                </div>
              ))}
        </div>
      </Block>
    </Reveal>
  );
}
