"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Truck } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Float, ParallaxImage } from "@/shared/animations/MotionImage";
import { Reveal } from "@/shared/animations/Reveal";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { useShippingZones } from "@/modules/checkout/hooks/useCheckout";

const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} et ${names.at(-1)}` : names[0]);

const BAND = "relative flex min-h-[107px] flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 py-6 text-center text-sm text-white sm:gap-x-3 sm:py-5 sm:text-lg";

function Band({ children }: { children: ReactNode }) {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-lg bg-ink-dark">
        <ParallaxImage src="/images/hero/hero-3.jpg" alt="" fill sizes="1300px" strength={30} wrapperClassName="absolute! inset-0" />
        <div className="absolute inset-0 bg-linear-to-r from-primary-dark/95 via-primary/80 to-black/70" />
        <div className={BAND}>{children}</div>
      </div>
    </Reveal>
  );
}

/**
 * Bandeau sous l'offre du jour (1300×107, rad 15, photo en parallaxe) : seuil de livraison offerte et zones concernées lus
 * dans les zones de livraison. Masqué si aucune zone n'offre la livraison (pas de promesse sans règle derrière).
 */
export function ShippingBanner() {
  const { data: zones } = useShippingZones();
  const formatPrice = useFormatPrice();
  const free = (zones ?? []).filter((z) => z.freeThreshold !== null);
  if (!free.length) return null;
  const threshold = Math.min(...free.map((z) => z.freeThreshold as number));
  const names = free.filter((z) => z.freeThreshold === threshold).map((z) => z.name);
  return (
    <Band>
      <Float>
        <Truck size={30} variant="Bold" className="text-sun" />
      </Float>
      <span className="font-semibold text-sun">Livraison offerte</span>
      <span>dès {formatPrice(threshold)} d’achat {names.length === free.length && free.length === zones?.length ? "partout où nous livrons" : `à ${list(names)}`}.</span>
      <Link href={ROUTES.guide} className="link-underline ml-0 basis-full py-1 text-sm font-semibold sm:ml-6 sm:basis-auto sm:font-normal">
        Zones et délais de livraison
      </Link>
    </Band>
  );
}
