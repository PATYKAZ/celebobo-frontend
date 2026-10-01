"use client";

import "swiper/css";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { ProductCard } from "@/modules/products/components/ProductCard";
import type { Product } from "@/modules/products/types";
import { SideArrow } from "@/shared/ui/SliderArrows";
import { ProductCardSkeleton } from "@/shared/ui/Skeleton";

interface Props {
  products?: Product[];
  loading?: boolean;
  /** Slides visibles ≥ xl (défaut 5) */
  perView?: 4 | 5;
}

/** Carrousel de cartes produit avec grandes flèches latérales (#EDEFF6, 40×80). */
export function ProductCarousel({ products, loading, perView = 5 }: Props) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [edge, setEdge] = useState({ begin: true, end: false });
  const sync = (s: SwiperType) => setEdge({ begin: s.isBeginning, end: s.isEnd });

  return (
    <div className="relative lg:px-[50px]">
      <SideArrow dir="prev" onClick={() => swiper?.slidePrev()} disabled={edge.begin} />
      <SideArrow dir="next" onClick={() => swiper?.slideNext()} disabled={edge.end} />
      {loading || !products ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: perView }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <Swiper
          onSwiper={(s) => {
            setSwiper(s);
            sync(s);
          }}
          onSlideChange={sync}
          onResize={sync}
          slidesPerView={2}
          breakpoints={{ 640: { slidesPerView: 3 }, 1024: { slidesPerView: 4 }, 1280: { slidesPerView: perView } }}
          spaceBetween={0}
          className="!overflow-hidden"
        >
          {products.map((p, i) => (
            <SwiperSlide key={p.id} className="!h-auto">
              <ProductCard product={p} priority={i < 3} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
