"use client";

import { Reveal } from "@/shared/animations/Reveal";
import { TiltCard } from "@/shared/animations/MotionImage";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { HomeContent } from "../types";
import { BannerPrice, bannerTone } from "./BannerBits";
import { CategorySidebar } from "./CategorySidebar";
import { HeroSlider } from "./HeroSlider";
import { PhotoBanner } from "./PhotoBanner";

const CTA_LINK = "mt-2 inline-block text-xs font-medium underline underline-offset-4";

/** Rangée défilante (snap) sur mobile, grille dès sm. */
const ROW = "max-sm:snap-row max-sm:mx-[-15px] max-sm:scroll-px-[15px] max-sm:px-4 max-sm:pb-1 sm:grid sm:grid-cols-2 sm:gap-4";

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
                      <p className={cn("line-clamp-2 max-w-[70%] whitespace-pre-line text-sm font-medium", t.text)}>{b.title}</p>
                      {b.product ? (
                        <p className="mt-1"><BannerPrice product={b.product} className={cn("text-lg", t.price)} strikeClassName={t.strike} /></p>
                      ) : (
                        b.subtitle && <p className={cn("mt-1 line-clamp-1 max-w-[75%] text-xs", t.muted)}>{b.subtitle}</p>
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
                      <div>
                        <p className={cn("line-clamp-2 max-w-[75%] whitespace-pre-line text-lg font-semibold", t.text)}>{b.title}</p>
                        {b.product ? (
                          <p className="mt-2">
                            <BannerPrice product={b.product} className={cn("text-xl", t.price)} strikeClassName={t.strike} />
                          </p>
                        ) : (
                          b.subtitle && <p className={cn("mt-2 line-clamp-2 max-w-[75%] text-xs", t.muted)}>{b.subtitle}</p>
                        )}
                        <span className="mt-3 flex h-9 w-fit items-center rounded-md bg-primary px-4 text-sm font-semibold text-white">{b.cta}</span>
                      </div>
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
