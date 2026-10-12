"use client";

import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Float, TiltCard } from "@/shared/animations/MotionImage";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";
import { getPricing } from "@/modules/products/utils";
import type { HomeContent } from "../types";
import { CategorySidebar } from "./CategorySidebar";
import { HeroSlider } from "./HeroSlider";
import { PhotoBanner } from "./PhotoBanner";

const CTA_LINK = "mt-2 inline-block text-[12px] font-medium uppercase underline underline-offset-4";

/** Rangée défilante (snap) sur mobile, grille dès sm. */
const ROW = "max-sm:snap-row max-sm:mx-[-15px] max-sm:scroll-px-[15px] max-sm:px-[15px] max-sm:pb-1 sm:grid sm:grid-cols-2 sm:gap-4";

/** Carrousel (bannières du back-office), 2 promotions dessous et 2 meilleures ventes à droite : vrais produits, vrais prix. */
export function HeroSection({ content }: { content?: HomeContent }) {
  const formatPrice = useFormatPrice();
  const picks = content?.picks;
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-[309px_minmax(0,1fr)] xl:grid-cols-[309px_minmax(0,1fr)_309px]">
      <CategorySidebar />

      {/* Colonne centrale : slider + 2 mini-bannières */}
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <HeroSlider slides={content?.slides} />
        <div className={ROW}>
          {picks
            ? picks.minis.map((p, i) => {
                const pricing = getPricing(p);
                return (
                  <Reveal key={p.id} delay={0.1 + i * 0.1} className="h-[120px] max-sm:w-[78%]">
                    <PhotoBanner image={p.image as string} href={ROUTES.product(p.slug)} label={p.name} overlay="from-black/80 via-black/55 to-black/10" className="h-full" sizes="(min-width:640px) 317px, 80vw" contentClassName="flex flex-col justify-center px-5">
                      <p className="line-clamp-2 max-w-[70%] text-[15px] font-medium leading-[18px] text-white">{p.name}</p>
                      <p className="mt-1 flex items-baseline gap-2">
                        <span className="text-[20px] font-bold leading-[24px] text-sun">{formatPrice(pricing.current)}</span>
                        {pricing.original != null && <s className="text-[12px] text-white/70">{formatPrice(pricing.original)}</s>}
                      </p>
                      <span className={cn(CTA_LINK, "text-white")}>Découvrir</span>
                    </PhotoBanner>
                  </Reveal>
                );
              })
            : [0, 1].map((i) => <Skeleton key={i} className="h-[120px] rounded-box max-sm:w-[78%]" />)}
        </div>
      </div>

      {/* Promos droite */}
      <div className={cn(ROW, "lg:col-span-2 xl:col-span-1 xl:grid-cols-1")}>
        {picks
          ? picks.promos.map((p, i) => (
              <Reveal key={p.id} delay={0.15 + i * 0.12} className="h-[170px] max-sm:w-[78%] sm:h-[230px] xl:h-[215px]">
                <TiltCard className="h-full overflow-hidden rounded-box">
                  <PhotoBanner image={p.image as string} href={ROUTES.product(p.slug)} label={p.name} overlay="from-black/80 via-black/45 to-transparent" className="h-full" sizes="(min-width:1280px) 309px, 80vw" contentClassName="flex flex-col justify-center px-6">
                    <Float slow>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/80">{p.category}</p>
                      <p className="mt-1 line-clamp-2 max-w-[75%] text-[19px] font-semibold leading-[23px] text-white">{p.name}</p>
                      <p className="mt-2 text-[10px] uppercase text-white/70">{getPricing(p).onSale ? "En promotion" : "Prix"}</p>
                      <p className="text-[24px] leading-[29px] text-sun">{formatPrice(getPricing(p).current)}</p>
                      <span className="mt-2 inline-flex h-9 items-center rounded-box bg-primary px-4 text-[11px] font-medium uppercase text-white sm:mt-3 sm:h-[33px]">Acheter</span>
                    </Float>
                  </PhotoBanner>
                </TiltCard>
              </Reveal>
            ))
          : [0, 1].map((i) => <Skeleton key={i} className="h-[170px] rounded-box max-sm:w-[78%] sm:h-[230px] xl:h-[215px]" />)}
      </div>
    </section>
  );
}
