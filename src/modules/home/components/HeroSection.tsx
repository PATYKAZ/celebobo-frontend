"use client";

import { Reveal } from "@/shared/animations/Reveal";
import { Float, TiltCard } from "@/shared/animations/MotionImage";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";
import { getPricing } from "@/modules/products/utils";
import type { HomeContent } from "../types";
import { BannerPrice, bannerTone } from "./BannerBits";
import { CategorySidebar } from "./CategorySidebar";
import { HeroSlider } from "./HeroSlider";
import { PhotoBanner } from "./PhotoBanner";

const CTA_LINK = "mt-2 inline-block text-[12px] font-medium uppercase underline underline-offset-4";

/** Rangée défilante (snap) sur mobile, grille dès sm. */
const ROW = "max-sm:snap-row max-sm:mx-[-15px] max-sm:scroll-px-[15px] max-sm:px-[15px] max-sm:pb-1 sm:grid sm:grid-cols-2 sm:gap-4";

/** Carrousel, 2 mini-bannières dessous et 2 cartes à droite : bannières de l'admin (`hero_mini`, `hero_side`), sinon vrais produits. */
export function HeroSection({ content }: { content?: HomeContent }) {
  const picks = content?.picks;
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-[309px_minmax(0,1fr)] xl:grid-cols-[309px_minmax(0,1fr)_309px]">
      <CategorySidebar />

      {/* Colonne centrale : slider + 2 mini-bannières */}
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <HeroSlider slides={content?.slides} />
        <div className={ROW}>
          {picks
            ? picks.minis.map((b, i) => {
                const t = bannerTone(b, "from-black/80 via-black/55 to-black/10");
                return (
                  <Reveal key={b.key} delay={0.1 + i * 0.1} className="h-[120px] max-sm:w-[78%]">
                    <PhotoBanner image={b.image} href={b.href} label={b.title} overlay={t.overlay} className="h-full" sizes="(min-width:640px) 317px, 80vw" contentClassName="flex flex-col justify-center px-5">
                      {b.eyebrow && !b.product && <p className={cn("text-[10px] uppercase tracking-[0.2em]", t.muted)}>{b.eyebrow}</p>}
                      <p className={cn("line-clamp-2 max-w-[70%] whitespace-pre-line text-[15px] font-medium leading-[18px]", t.text)}>{b.title}</p>
                      {b.product ? (
                        <p className="mt-1"><BannerPrice product={b.product} className={cn("text-[20px] leading-[24px]", t.price)} strikeClassName={t.strike} /></p>
                      ) : (
                        b.subtitle && <p className={cn("mt-1 line-clamp-1 max-w-[75%] text-[12px]", t.muted)}>{b.subtitle}</p>
                      )}
                      <span className={cn(CTA_LINK, t.text)}>{b.cta}</span>
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
          ? picks.promos.map((b, i) => {
              const t = bannerTone(b, "from-black/80 via-black/45 to-transparent");
              return (
                <Reveal key={b.key} delay={0.15 + i * 0.12} className="h-[170px] max-sm:w-[78%] sm:h-[230px] xl:h-[215px]">
                  <TiltCard className="h-full overflow-hidden rounded-box">
                    <PhotoBanner image={b.image} href={b.href} label={b.title} overlay={t.overlay} className="h-full" sizes="(min-width:1280px) 309px, 80vw" contentClassName="flex flex-col justify-center px-6">
                      <Float slow>
                        {b.eyebrow && <p className={cn("text-[10px] uppercase tracking-[0.2em]", t.muted)}>{b.eyebrow}</p>}
                        <p className={cn("mt-1 line-clamp-2 max-w-[75%] whitespace-pre-line text-[19px] font-semibold leading-[23px]", t.text)}>{b.title}</p>
                        {b.product ? (
                          <>
                            <p className={cn("mt-2 text-[10px] uppercase", t.muted)}>{getPricing(b.product).onSale ? "En promotion" : "Prix"}</p>
                            <BannerPrice product={b.product} className={cn("text-[24px] font-normal leading-[29px]", t.price)} strikeClassName={t.strike} />
                          </>
                        ) : (
                          b.subtitle && <p className={cn("mt-2 line-clamp-2 max-w-[75%] text-[12px] leading-[17px]", t.muted)}>{b.subtitle}</p>
                        )}
                        <span className="mt-2 inline-flex h-9 items-center rounded-box bg-primary px-4 text-[11px] font-medium uppercase text-white sm:mt-3 sm:h-[33px]">{b.cta}</span>
                      </Float>
                    </PhotoBanner>
                  </TiltCard>
                </Reveal>
              );
            })
          : [0, 1].map((i) => <Skeleton key={i} className="h-[170px] rounded-box max-sm:w-[78%] sm:h-[230px] xl:h-[215px]" />)}
      </div>
    </section>
  );
}
