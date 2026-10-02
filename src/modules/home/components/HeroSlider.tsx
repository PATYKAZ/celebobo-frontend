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

/** Hauteur du héro : explicite (jamais 0) — 300 px mobile, 310 px dès sm (design). */
const HEIGHT = "h-[300px] sm:h-[310px]";

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
        className={cn("object-cover object-[65%_center] will-change-transform sm:object-center", active && "animate-ken-burns")}
      />
      {/* desktop : dégradé du design ; mobile : voile sombre bas → texte blanc toujours lisible */}
      <div className={cn("absolute inset-0 hidden bg-gradient-to-r sm:block", slide.overlay)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10 sm:hidden" />
      <motion.div
        variants={container}
        initial="hidden"
        animate={active ? "show" : "hidden"}
        className={cn("relative z-10 flex h-full flex-col justify-end gap-0 px-5 pb-12 text-white sm:max-w-[62%] sm:justify-center sm:px-0 sm:pb-0 sm:pl-[60px]", !dark && "sm:text-ink")}
      >
        {slide.eyebrow && (
          <motion.p variants={item} className={cn("mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80", !dark && "sm:text-ink-2")}>
            {slide.eyebrow}
          </motion.p>
        )}
        <motion.h2 variants={item} className="text-[26px] font-medium leading-[30px] sm:text-h-hero">
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
          <Link href={slide.cta.href} className={cn("inline-flex h-11 items-center rounded-box px-5 text-[12px] font-semibold uppercase transition-all active:scale-95 sm:h-[34px] sm:px-4 sm:font-medium", CTA[slide.cta.variant])}>
            {slide.cta.label}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Slider héro : fondu, Ken Burns sur la slide active, textes en cascade. Mobile : points de pagination ; desktop : contrôle fraction. */
export function HeroSlider({ slides, className }: { slides?: HeroSlide[]; className?: string }) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [index, setIndex] = useState(0);

  if (!slides) return <Skeleton className={cn("rounded-box", HEIGHT, className)} />;

  return (
    <div className={cn("relative overflow-hidden rounded-box", HEIGHT, className)}>
      <Swiper
        modules={[Autoplay]}
        loop
        speed={800}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        onSwiper={setSwiper}
        onSlideChange={(s) => setIndex(s.realIndex)}
        className="h-full w-full"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={s.id} className="!h-full">
            <Slide slide={s} active={i === index} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* mobile : points (zone tactile 24 px) */}
      <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-0.5 sm:hidden">
        {slides.map((s, i) => (
          <button key={s.id} aria-label={`Slide ${i + 1}`} aria-current={i === index} onClick={() => swiper?.slideToLoop(i)} className="grid h-6 w-6 place-items-center">
            <span className={cn("h-2 rounded-full bg-white transition-all duration-300", i === index ? "w-6 opacity-100" : "w-2 opacity-50")} />
          </button>
        ))}
      </div>

      {/* desktop : contrôle fraction */}
      <div className="absolute bottom-5 right-5 z-20 hidden h-[29px] w-[107px] items-center justify-between rounded-pill bg-white px-3 text-[14px] leading-[21px] sm:flex">
        <button aria-label="Slide précédente" onClick={() => swiper?.slidePrev()} className="p-1 transition-colors hover:text-primary">
          <ArrowLeft2 size={12} variant="Bold" />
        </button>
        <span className="tabular-nums">
          {index + 1} / {slides.length}
        </span>
        <button aria-label="Slide suivante" onClick={() => swiper?.slideNext()} className="p-1 transition-colors hover:text-primary">
          <ArrowRight2 size={12} variant="Bold" />
        </button>
      </div>
    </div>
  );
}
