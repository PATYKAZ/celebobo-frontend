"use client";

import "swiper/css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { ROUTES } from "@/config/routes";
import { Marquee } from "@/shared/animations/MotionImage";
import { Reveal, RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Skeleton } from "@/shared/ui/Skeleton";
import { SliderArrows } from "@/shared/ui/SliderArrows";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import type { Brand } from "../types";

function Wordmark({ brand }: { brand: Brand }) {
  return (
    <span
      className={cn("inline-block select-none text-[#b4b7c0] grayscale transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:grayscale-0", brand.className)}
      onMouseEnter={(e) => (e.currentTarget.style.color = brand.color)}
      onMouseLeave={(e) => (e.currentTarget.style.color = "")}
    >
      {brand.name}
    </span>
  );
}

function FeaturedBrands({ brands }: { brands?: Brand[] }) {
  return (
    <Block pad="none" className="min-h-[227px] px-5 py-6 sm:px-[30px]">
      <SectionHeader title="Marques à la une" viewAllHref={ROUTES.products} />
      {!brands ? (
        <Skeleton className="mt-8 h-[110px]" />
      ) : (
        <>
          <RevealGroup stagger={0.05} className="mt-8 hidden grid-cols-5 items-center gap-y-9 md:grid">
            {brands.map((b) => (
              <RevealItem key={b.name} className="flex justify-center">
                <Link href={ROUTES.search(b.name)} aria-label={b.name}>
                  <Wordmark brand={b} />
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
          <Marquee className="mt-8 md:hidden">
            {brands.map((b) => (
              <Wordmark key={b.name} brand={b} />
            ))}
          </Marquee>
        </>
      )}
    </Block>
  );
}

function TopCategories() {
  const { data: categories, isLoading } = useCategories();
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [edge, setEdge] = useState({ begin: true, end: false });
  const sync = (s: SwiperType) => setEdge({ begin: s.isBeginning, end: s.isEnd });

  return (
    <Block pad="none" className="min-h-[227px] px-5 py-6 sm:px-[30px]">
      <SectionHeader
        title="Top catégories"
        viewAllHref={ROUTES.products}
        right={<SliderArrows onPrev={() => swiper?.slidePrev()} onNext={() => swiper?.slideNext()} canPrev={!edge.begin} canNext={!edge.end} />}
      />
      <div className="mt-7">
        {isLoading || !categories ? (
          <Skeleton className="h-[130px]" />
        ) : (
          <Swiper
            onSwiper={(s) => {
              setSwiper(s);
              sync(s);
            }}
            onSlideChange={sync}
            slidesPerView={2}
            spaceBetween={12}
            breakpoints={{ 480: { slidesPerView: 3 }, 768: { slidesPerView: 4 } }}
          >
            {categories.map((c) => (
              <SwiperSlide key={c.id}>
                <Link href={ROUTES.category(c.id)} className="group flex flex-col items-center gap-3 py-1">
                  <span className="relative block size-[84px] overflow-hidden rounded-full bg-chip ring-2 ring-transparent transition-all duration-500 group-hover:-translate-y-1 group-hover:ring-primary">
                    {c.image && <Image src={c.image} alt="" fill sizes="84px" className="object-cover transition-transform duration-700 group-hover:scale-125" />}
                  </span>
                  <span className="text-center text-[14px] font-semibold leading-[20px] transition-colors group-hover:text-primary">{c.name}</span>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </Block>
  );
}

export function BrandsAndCategories({ brands }: { brands?: Brand[] }) {
  return (
    <Reveal className="grid gap-4 lg:grid-cols-2">
      <FeaturedBrands brands={brands} />
      <TopCategories />
    </Reveal>
  );
}
