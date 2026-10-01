"use client";

import "swiper/css";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ArrowLeft2, ArrowRight2, RecordCircle } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { HeroSlide } from "../types";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const CTA = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  dark: "bg-black text-white hover:bg-primary",
  white: "bg-white text-ink hover:bg-primary hover:text-white",
};

function Slide({ slide, active }: { slide: HeroSlide; active: boolean }) {
  const dark = slide.tone === "dark";
  return (
    <div className="relative h-full overflow-hidden">
      <Image
        src={slide.image}
        alt=""
        fill
        priority={slide.id === 1}
        sizes="(min-width:1024px) 650px, 100vw"
        key={active ? "on" : "off"}
        className={cn("object-cover will-change-transform", active && "animate-ken-burns")}
      />
      <div className={cn("absolute inset-0 bg-gradient-to-r", slide.overlay)} />
      <motion.div
        variants={container}
        initial="hidden"
        animate={active ? "show" : "hidden"}
        className={cn("relative z-10 flex h-full max-w-[62%] flex-col justify-center gap-0 pl-6 sm:pl-[60px]", dark ? "text-white" : "text-ink")}
      >
        {slide.eyebrow && (
          <motion.p variants={item} className={cn("mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]", dark ? "text-white/80" : "text-ink-2")}>
            {slide.eyebrow}
          </motion.p>
        )}
        <motion.h2 variants={item} className="text-[22px] font-medium leading-[28px] sm:text-h-hero">
          {slide.titleLines.map((l) => (
            <span key={l.text} className={cn("block", l.className)}>
              {l.text}
            </span>
          ))}
        </motion.h2>
        {slide.text && (
          <motion.p variants={item} className="mt-3 hidden text-[12px] leading-[20.4px] opacity-90 sm:block">
            {slide.text}
          </motion.p>
        )}
        {slide.bullets && (
          <motion.ul variants={item} className="mt-3 hidden space-y-1 sm:block">
            {slide.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-[12px] leading-[18px]">
                <RecordCircle size={12} variant="Bold" className="text-primary" /> {b}
              </li>
            ))}
          </motion.ul>
        )}
        <motion.div variants={item} className="mt-4 sm:mt-5">
          <Link href={slide.cta.href} className={cn("inline-flex h-[34px] items-center rounded-box px-4 text-[12px] font-medium uppercase transition-colors", CTA[slide.cta.variant])}>
            {slide.cta.label}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Slider héro (650×310) : fondu, Ken Burns sur la slide active, textes en cascade, contrôle fraction. */
export function HeroSlider({ slides, className }: { slides?: HeroSlide[]; className?: string }) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [index, setIndex] = useState(0);

  if (!slides) return <Skeleton className={cn("h-[260px] rounded-box sm:h-[310px]", className)} />;

  return (
    <div className={cn("relative h-[260px] overflow-hidden rounded-box sm:h-[310px]", className)}>
      <Swiper
        modules={[Autoplay]}
        loop
        speed={800}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        onSwiper={setSwiper}
        onSlideChange={(s) => setIndex(s.realIndex)}
        className="h-full"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={s.id}>
            <Slide slide={s} active={i === index} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="absolute bottom-5 right-5 z-20 flex h-[29px] w-[107px] items-center justify-between rounded-pill bg-white px-3 text-[14px] leading-[21px]">
        <button aria-label="Slide précédente" onClick={() => swiper?.slidePrev()} className="transition-colors hover:text-primary">
          <ArrowLeft2 size={12} variant="Bold" />
        </button>
        <span className="tabular-nums">
          {index + 1} / {slides.length}
        </span>
        <button aria-label="Slide suivante" onClick={() => swiper?.slideNext()} className="transition-colors hover:text-primary">
          <ArrowRight2 size={12} variant="Bold" />
        </button>
      </div>
    </div>
  );
}
