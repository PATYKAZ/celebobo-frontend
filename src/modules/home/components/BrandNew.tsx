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
import type { EditorialCard } from "../types";

/** « Nouveau pour vous » : 4 cartes éditoriales (image 303×230, titre, texte, bouton outline). */
export function BrandNew({ cards }: { cards?: EditorialCard[] }) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [edge, setEdge] = useState({ begin: true, end: false });
  const sync = (s: SwiperType) => setEdge({ begin: s.isBeginning, end: s.isEnd });

  return (
    <Reveal>
      <Block pad="none" className="px-5 pb-[30px] pt-[30px] sm:px-[30px]">
        <SectionHeader title="Nouveau pour vous" right={<SliderArrows onPrev={() => swiper?.slidePrev()} onNext={() => swiper?.slideNext()} canPrev={!edge.begin} canNext={!edge.end} />} />
        <div className="mt-7">
          {!cards ? (
            <Skeleton className="h-[330px]" />
          ) : (
            <Swiper
              onSwiper={(s) => {
                setSwiper(s);
                sync(s);
              }}
              onSlideChange={sync}
              slidesPerView={1}
              spaceBetween={10}
              breakpoints={{ 560: { slidesPerView: 2 }, 900: { slidesPerView: 3 }, 1200: { slidesPerView: 4 } }}
            >
              {cards.map((c) => (
                <SwiperSlide key={c.id} className="!h-auto">
                  <article className="group flex h-full flex-col">
                    <div className="relative aspect-[303/230] overflow-hidden rounded-box bg-chip">
                      <Image src={c.image} alt={c.title} fill sizes="303px" className="object-cover transition-transform duration-[900ms] group-hover:scale-110" />
                      <span aria-hidden className="absolute inset-y-0 left-0 w-1/4 -translate-x-[120%] bg-white/25 group-hover:animate-sheen" />
                    </div>
                    <h3 className="mt-5 text-[16px] leading-[19.2px]">{c.title}</h3>
                    <p className="mt-2 flex-1 text-[13px] leading-[22.1px] text-ink-2">{c.text}</p>
                    <Button href={c.href} variant="outline" size="sm" className="mt-4 h-[35px] w-[123px] self-start text-[11px]">
                      Acheter
                    </Button>
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
