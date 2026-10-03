"use client";

import "swiper/css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "iconsax-reactjs";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { formatPrice } from "@/shared/lib/format";
import { NewBadge } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { SliderArrows } from "@/shared/ui/SliderArrows";
import { Stars } from "@/shared/ui/Stars";
import { useFavoriteToggle } from "@/modules/favorites/hooks/useFavorites";
import type { Product } from "@/modules/products/types";
import { useRecentlyViewedStore, type ViewedProduct } from "@/modules/products/store/recently-viewed.store";

function MiniCard({ p }: { p: ViewedProduct }) {
  const { isFavorite, toggle } = useFavoriteToggle();
  const fav = isFavorite(p.id);
  const sale = p.priceSolde != null && p.priceSolde < p.price;
  const heart = (
    <button
      onClick={() => toggle(p.id, p.name)}
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      className="grid size-8 place-items-center rounded-full bg-white/95 text-ink-3 shadow-[0_2px_8px_rgba(0,0,0,.12)] transition-colors hover:text-danger active:scale-90 sm:size-[30px] sm:bg-page sm:shadow-none"
    >
      <Heart size={14} variant={fav ? "Bold" : "Linear"} color={fav ? "#F1352B" : "currentColor"} />
    </button>
  );
  return (
    <div className="group relative flex min-h-[117px] items-start gap-3 rounded-box border border-line-2/20 p-[11px] transition-all duration-300 hover:border-primary hover:shadow-[0_8px_24px_rgba(0,0,0,.07)] sm:items-center">
      <div className="relative shrink-0">
        <Link href={ROUTES.product(p.slug)} className="relative block h-[92px] w-[92px] overflow-hidden rounded-md bg-page/50 sm:h-[90px] sm:w-[120px]" aria-label={p.name}>
          {p.image && <Image src={p.image} alt="" fill sizes="120px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
          {p.currentBadge === "Nouveauté" && <NewBadge className="absolute left-1 top-1 scale-90" />}
        </Link>
        {/* mobile : le cœur flotte sur l'image (ne recouvre plus le texte) */}
        <span className="absolute -right-1.5 -top-1.5 sm:hidden">{heart}</span>
      </div>
      <div className="min-w-0 flex-1 sm:pr-10">
        {p.reviewsCount > 0 && <Stars rating={p.rating} count={p.reviewsCount} size={11} />}
        <Link href={ROUTES.product(p.slug)} className="mt-1 line-clamp-3 text-[13px] font-bold leading-[18px] hover:text-primary sm:line-clamp-2 sm:leading-[19.5px]">{p.name}</Link>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 text-[16px] font-bold leading-[19.2px]">
          <span className={sale ? "text-danger" : undefined}>{formatPrice(p.priceSolde ?? p.price)}</span>
          {sale && <span className="text-[13px] font-bold text-ink-2 line-through">{formatPrice(p.price)}</span>}
        </p>
      </div>
      <span className="absolute right-[11px] top-[11px] hidden sm:block">{heart}</span>
    </div>
  );
}

/** Récemment consultés (store persistant) — repli : meilleures ventes de l'accueil. */
export function RecentlyViewed({ fallback }: { fallback?: Product[] }) {
  const viewed = useRecentlyViewedStore((s) => s.items);
  const items: ViewedProduct[] = viewed.length ? viewed : (fallback ?? []);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [edge, setEdge] = useState({ begin: true, end: false });
  const sync = (s: SwiperType) => setEdge({ begin: s.isBeginning, end: s.isEnd });

  if (!items.length) return null;
  return (
    <Reveal>
      <Block pad="none" className="min-w-0 overflow-hidden px-4 pb-5 pt-4 sm:px-[30px] sm:pb-[30px] sm:pt-[30px]">
        <SectionHeader
          title={viewed.length ? "Récemment consultés" : "Vous pourriez aimer"}
          viewAllHref={ROUTES.products}
          right={<SliderArrows className="hidden md:flex" onPrev={() => swiper?.slidePrev()} onNext={() => swiper?.slideNext()} canPrev={!edge.begin} canNext={!edge.end} />}
        />
        <div className="mt-4 sm:mt-6">
          <Swiper
            className="w-full"
            onSwiper={(s) => {
              setSwiper(s);
              sync(s);
            }}
            onSlideChange={sync}
            slidesPerView={1.15}
            spaceBetween={0}
            breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 }, 1280: { slidesPerView: 4 } }}
          >
            {items.map((p) => (
              <SwiperSlide key={p.id} className="pr-3">
                <MiniCard p={p} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Block>
    </Reveal>
  );
}
