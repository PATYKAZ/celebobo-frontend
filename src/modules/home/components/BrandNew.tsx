"use client";

import "swiper/css";
import Image from "next/image";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Skeleton } from "@/shared/ui/Skeleton";
import { SliderArrows } from "@/shared/ui/SliderArrows";
import { ROUTES } from "@/config/routes";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";

/** « Nouveau pour vous » : les derniers produits arrivés (image 303×230, nom, description, prix, bouton outline). */
export function BrandNew({ products }: { products?: Product[] }) {
  const formatPrice = useFormatPrice();
  const cards = products?.filter((p) => p.image);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [edge, setEdge] = useState({ begin: true, end: false });
  const sync = (s: SwiperType) => setEdge({ begin: s.isBeginning, end: s.isEnd });

  return (
    <Reveal>
      <Block pad="none" className="min-w-0 overflow-hidden px-4 pb-5 pt-4 sm:px-[30px] sm:pb-[30px] sm:pt-[30px]">
        <SectionHeader title="Nouveau pour vous" right={<SliderArrows className="hidden md:flex" onPrev={() => swiper?.slidePrev()} onNext={() => swiper?.slideNext()} canPrev={!edge.begin} canNext={!edge.end} />} />
        <div className="mt-4 sm:mt-7">
          {!cards ? (
            <Skeleton className="h-[330px]" />
          ) : (
            <Swiper
              className="w-full"
              onSwiper={(s) => {
                setSwiper(s);
                sync(s);
              }}
              onSlideChange={sync}
              slidesPerView={1.12}
              spaceBetween={12}
              breakpoints={{ 560: { slidesPerView: 2 }, 900: { slidesPerView: 3 }, 1200: { slidesPerView: 4 } }}
            >
              {cards.map((c) => (
                <SwiperSlide key={c.id} className="h-auto!">
                  <article className="group flex h-full flex-col">
                    <div className="relative aspect-303/230 overflow-hidden rounded-box bg-chip">
                      <Image src={c.image as string} alt={c.name} fill sizes="303px" className="object-cover transition-transform duration-900 group-hover:scale-110" />
                      <span aria-hidden className="absolute inset-y-0 left-0 w-1/4 translate-x-[-120%] bg-white/25 group-hover:animate-sheen" />
                    </div>
                    <h3 className="mt-3 text-[16px] leading-[19.2px] sm:mt-5">{c.name}</h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-[22.1px] text-ink-2">{c.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 sm:mt-4">
                      <span className="text-[16px] font-bold text-primary">{formatPrice(getPricing(c).current)}</span>
                      <Button href={ROUTES.product(c.slug)} variant="outline" size="sm" className="h-[35px] w-[123px] text-[11px]">
                        Acheter
                      </Button>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </Block>
    </Reveal>
  );
}
