"use client";

import Link from "next/link";
import { Star1 } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { Float, ParallaxImage } from "@/shared/animations/MotionImage";
import { Reveal } from "@/shared/animations/Reveal";

/** Bannière « Membres : livraison gratuite » (1300×107, rad 15, photo en parallaxe). */
export function MemberBanner() {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[15px] bg-ink-dark">
        <ParallaxImage src="/images/hero/hero-3.jpg" alt="" fill sizes="1300px" strength={30} wrapperClassName="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary/80 to-black/70" />
        <div className="relative flex min-h-[107px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-5 text-center text-[15px] leading-[28px] text-white sm:text-[18px] sm:leading-[32.4px]">
          <Float>
            <Star1 size={30} variant="Bold" className="text-sun" />
          </Float>
          <span>Membres :</span>
          <span className="font-semibold uppercase text-sun">livraison gratuite*</span>
          <span>sans minimum de commande. *Conditions applicables</span>
          <Link href={ROUTES.register} className="link-underline ml-0 text-[14px] leading-[25px] sm:ml-6">
            Essayez gratuitement 30 jours !
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
