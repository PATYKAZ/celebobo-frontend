"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { Block } from "@/shared/ui/Block";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { SliderArrows } from "@/shared/ui/SliderArrows";
import { ProductCardSkeleton } from "@/shared/ui/Skeleton";
import { ROUTES } from "@/config/routes";
import { useRelatedProducts } from "../hooks/useProducts";
import { ProductCard } from "./ProductCard";

export function RelatedProducts({ slug }: { slug: string }) {
  const { data, isLoading } = useRelatedProducts(slug);
  const [sw, setSw] = useState<SwiperType>();
  const [edge, setEdge] = useState({ begin: true, end: false });

  if (!isLoading && !data?.length) return null;

  return (
    <Block pad="none" className="min-w-0 overflow-hidden p-3 sm:p-[30px]">
      <SectionHeader
        title="Produits similaires"
        viewAllHref={ROUTES.products}
        right={<SliderArrows className="hidden md:flex" onPrev={() => sw?.slidePrev()} onNext={() => sw?.slideNext()} canPrev={!edge.begin} canNext={!edge.end} />}
      />
      <div className="mt-3 sm:mt-5">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <ProductCardSkeleton key={i} />)}</div>
        ) : (
          <Swiper
            onSwiper={setSw}
            onSlideChange={(s) => setEdge({ begin: s.isBeginning, end: s.isEnd })}
            slidesPerView={1.6}
            className="w-full"
            breakpoints={{ 480: { slidesPerView: 2.2 }, 640: { slidesPerView: 3 }, 1024: { slidesPerView: 4 }, 1280: { slidesPerView: 5 } }}
          >
            {data?.map((p) => (
              <SwiperSlide key={p.id} className="!h-auto">
                <ProductCard product={p} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </Block>
  );
}
