"use client";

import { Reveal } from "@/shared/animations/Reveal";
import { Float, TiltCard } from "@/shared/animations/MotionImage";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { HomeContent } from "../types";
import { CategorySidebar } from "./CategorySidebar";
import { HeroSlider } from "./HeroSlider";
import { PhotoBanner } from "./PhotoBanner";

const CTA_LINK = "mt-2 inline-block text-[12px] font-medium uppercase underline underline-offset-4";

/** Rangée défilante (snap) sur mobile, grille dès sm. */
const ROW = "max-sm:snap-row max-sm:-mx-[15px] max-sm:scroll-px-[15px] max-sm:px-[15px] max-sm:pb-1 sm:grid sm:grid-cols-2 sm:gap-4";

export function HeroSection({ content }: { content?: HomeContent }) {
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-[309px_minmax(0,1fr)] xl:grid-cols-[309px_minmax(0,1fr)_309px]">
      <CategorySidebar />

      {/* Colonne centrale : slider + 2 mini-bannières */}
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <HeroSlider slides={content?.slides} />
        <div className={ROW}>
          {content
            ? content.miniBanners.map((b, i) => (
                <Reveal key={b.id} delay={0.1 + i * 0.1} className="h-[120px] max-sm:w-[78%]">
                  <PhotoBanner image={b.image} href="#" label={b.lines} overlay={b.overlay} className="h-full" sizes="(min-width:640px) 317px, 80vw" contentClassName="flex flex-col justify-center px-5">
                    <p className={cn("whitespace-pre-line text-[15px] font-medium leading-[18px]", b.tone === "dark" ? "text-white" : "text-ink")}>
                      {b.lines}
                    </p>
                    {b.highlight && <p className={cn("mt-1 text-[20px] font-bold leading-[24px]", b.highlightClass)}>{b.highlight}</p>}
                    {b.sub && <p className="mt-1 text-[12px] leading-[20px] text-white/90">{b.sub}</p>}
                    {b.cta && <span className={cn(CTA_LINK, "text-ink")}>{b.cta.label}</span>}
                  </PhotoBanner>
                </Reveal>
              ))
            : [0, 1].map((i) => <Skeleton key={i} className="h-[120px] rounded-box max-sm:w-[78%]" />)}
        </div>
      </div>

      {/* Promos droite */}
      <div className={cn(ROW, "lg:col-span-2 xl:col-span-1 xl:grid-cols-1")}>
        {content
          ? content.promoCards.map((c, i) => (
              <Reveal key={c.id} delay={0.15 + i * 0.12} className="h-[170px] max-sm:w-[78%] sm:h-[230px] xl:h-[215px]">
                <TiltCard className="h-full overflow-hidden rounded-box">
                  <PhotoBanner image={c.image} href={c.cta.href} label={c.title} overlay={c.overlay} className="h-full" sizes="(min-width:1280px) 309px, 80vw" contentClassName="flex flex-col justify-center px-6">
                    <Float slow>
                      <p className={cn("text-[10px] uppercase tracking-[0.2em]", c.tone === "dark" ? "text-white/80" : "text-ink-2")}>{c.eyebrow}</p>
                      <p className={cn("mt-1 whitespace-pre-line text-[19px] font-semibold leading-[23px]", c.tone === "dark" ? "text-white" : "text-ink")}>{c.title}</p>
                      {c.from && <p className="mt-2 text-[10px] uppercase text-ink-3">{c.from}</p>}
                      {c.price && <p className="text-[24px] leading-[29px] text-primary">{c.price}</p>}
                      <span className={cn("mt-2 inline-flex h-9 items-center rounded-box px-4 text-[11px] font-medium uppercase sm:mt-3 sm:h-[33px]", c.tone === "dark" ? "bg-primary text-white" : "bg-ink-dark2 text-white")}>
                        {c.cta.label}
                      </span>
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
