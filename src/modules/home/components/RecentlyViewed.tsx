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
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useRecentlyViewedStore, type ViewedProduct } from "@/modules/products/store/recently-viewed.store";

function MiniCard({ p }: { p: ViewedProduct }) {
  const { isFavorite, toggle } = useFavoriteToggle();
  const fav = isFavorite(p.id);
  const sale = p.priceSolde != null && p.priceSolde < p.price;
  return (
    <div className="group relative flex h-[117px] items-center gap-3 rounded-box border border-line-2/20 p-[11px] transition-all duration-300 hover:border-primary hover:shadow-[0_8px_24px_rgba(0,0,0,.07)]">
      <Link href={ROUTES.product(p.id)} className="relative h-[90px] w-[120px] shrink-0 overflow-hidden rounded-md bg-page/50" aria-label={p.name}>
        {p.image && <Image src={p.image} alt="" fill sizes="120px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
        {p.currentBadge === "Nouveauté" && <NewBadge className="absolute left-1 top-1 scale-90" />}
      </Link>
      <div className="min-w-0 flex-1 pr-6">
        {p.reviewsCount > 0 && <Stars rating={p.rating} count={p.reviewsCount} size={11} />}
        <Link href={ROUTES.product(p.id)} className="mt-1 line-clamp-2 text-[13px] font-bold leading-[19.5px] hover:text-primary">{p.name}</Link>
        <p className="mt-1 text-[16px] font-bold leading-[19.2px]">
          <span className={sale ? "text-danger" : undefined}>{formatPrice(p.priceSolde ?? p.price)}</span>
          {sale && <span className="ml-1.5 text-[13px] font-bold text-ink-2 line-through">{formatPrice(p.price)}</span>}
        </p>
      </div>
      <button onClick={() => toggle(p.id, p.name)} aria-label="Favori" className="absolute right-[11px] top-[11px] grid size-[30px] place-items-center rounded-full bg-page text-ink-3 transition-colors hover:text-danger">
        <Heart size={14} variant={fav ? "Bold" : "Linear"} color={fav ? "#F1352B" : "currentColor"} />
      </button>
    </div>
  );
}

/** Récemment consultés (store persistant) — repli : produits populaires. */
export function RecentlyViewed() {
  const viewed = useRecentlyViewedStore((s) => s.items);
  const { data } = useProducts({ ordering: "-sales", pageSize: 8 }, viewed.length === 0);
  const items: ViewedProduct[] = viewed.length ? viewed : (data?.results ?? []);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [edge, setEdge] = useState({ begin: true, end: false });
  const sync = (s: SwiperType) => setEdge({ begin: s.isBeginning, end: s.isEnd });

  if (!items.length) return null;
  return (
    <Reveal>
      <Block pad="none" className="px-5 pb-[30px] pt-[30px] sm:px-[30px]">
        <SectionHeader
          title={viewed.length ? "Récemment consultés" : "Vous pourriez aimer"}
          viewAllHref={ROUTES.products}
          right={<SliderArrows onPrev={() => swiper?.slidePrev()} onNext={() => swiper?.slideNext()} canPrev={!edge.begin} canNext={!edge.end} />}
        />
        <div className="mt-6">
          <Swiper
            onSwiper={(s) => {
              setSwiper(s);
              sync(s);
            }}
            onSlideChange={sync}
            slidesPerView={1}
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
