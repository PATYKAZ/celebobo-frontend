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
    <Block pad="none" className="min-w-0 overflow-hidden px-4 py-4 sm:px-[30px] sm:py-6 lg:min-h-[227px]">
      <SectionHeader title="Marques à la une" viewAllHref={ROUTES.products} />
      {!brands ? (
        <Skeleton className="mt-5 h-[60px] sm:mt-8 sm:h-[110px]" />
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
          <Marquee className="mt-4 md:hidden">
            {brands.map((b) => (
              <Wordmark key={b.name} brand={b} />
            ))}
          </Marquee>
        </>
      )}
    </Block>
  );
}

/** Pastille ronde « lanceur d'app » (mobile) / vignette 84 px (desktop). */
function CategoryDot({ slug, name, image, size }: { slug: string; name: string; image: string | null; size: number }) {
  return (
    <Link href={ROUTES.category(slug)} className="group flex flex-col items-center gap-2 py-1 active:scale-95">
      <span className="relative block overflow-hidden rounded-full bg-chip ring-2 ring-transparent transition-all duration-500 group-hover:-translate-y-1 group-hover:ring-primary" style={{ width: size, height: size }}>
        {image && <Image src={image} alt="" fill sizes={`${size}px`} className="object-cover transition-transform duration-700 group-hover:scale-125" />}
      </span>
      <span className="line-clamp-2 text-center text-[12px] font-semibold leading-[16px] transition-colors group-hover:text-primary sm:text-[14px] sm:leading-[20px]">{name}</span>
    </Link>
  );
}

function TopCategories() {
  const { data: categories, isLoading } = useCategories();
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [edge, setEdge] = useState({ begin: true, end: false });
  const sync = (s: SwiperType) => setEdge({ begin: s.isBeginning, end: s.isEnd });

  return (
    <Block pad="none" className="min-w-0 overflow-hidden px-4 py-4 sm:px-[30px] sm:py-6 lg:min-h-[227px]">
      <SectionHeader
        title={<><span className="sm:hidden">Catégories</span><span className="hidden sm:inline">Top catégories</span></>}
        viewAllHref={ROUTES.products}
        right={<SliderArrows className="hidden md:flex" onPrev={() => swiper?.slidePrev()} onNext={() => swiper?.slideNext()} canPrev={!edge.begin} canNext={!edge.end} />}
      />
      {isLoading || !categories ? (
        <Skeleton className="mt-4 h-[96px] sm:mt-7 sm:h-[130px]" />
      ) : (
        <>
          {/* mobile : lanceurs défilants */}
          <div className="snap-row -mx-4 mt-3 scroll-px-4 gap-1 px-4 md:hidden">
            {categories.map((c) => (
              <div key={c.id} className="w-[76px]">
                <CategoryDot slug={c.slug} name={c.name} image={c.image} size={64} />
              </div>
            ))}
          </div>
          {/* tablette / desktop : carrousel */}
          <div className="mt-7 hidden md:block">
            <Swiper
              onSwiper={(s) => {
                setSwiper(s);
                sync(s);
              }}
              onSlideChange={sync}
              slidesPerView={3}
              spaceBetween={12}
              breakpoints={{ 768: { slidesPerView: 4 } }}
              className="w-full"
            >
              {categories.map((c) => (
                <SwiperSlide key={c.id}>
                  <CategoryDot slug={c.slug} name={c.name} image={c.image} size={84} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </>
      )}
    </Block>
  );
}

export function BrandsAndCategories({ brands }: { brands?: Brand[] }) {
  return (
    <Reveal className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-2">
      {/* mobile : catégories d'abord (accès rapide) */}
      <div className="min-w-0 max-lg:order-2">
        <FeaturedBrands brands={brands} />
      </div>
      <div className="min-w-0 max-lg:order-1">
        <TopCategories />
      </div>
    </Reveal>
  );
}
