"use client";

import Link from "next/link";
import { Truck } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Float, ParallaxImage } from "@/shared/animations/MotionImage";
import { Reveal } from "@/shared/animations/Reveal";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { useShippingZones } from "@/modules/checkout/hooks/useCheckout";

const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} et ${names.at(-1)}` : names[0]);

/**
 * Bandeau livraison (1300×107, rad 15, photo en parallaxe) : seuil de livraison offerte et zones concernées lus
 * dans les zones de livraison. Masqué si aucune zone n'offre la livraison (pas de promesse sans règle derrière).
 */
export function MemberBanner() {
  const { data: zones } = useShippingZones();
  const formatPrice = useFormatPrice();
  const free = (zones ?? []).filter((z) => z.freeThreshold !== null);
  if (!free.length) return null;
  const threshold = Math.min(...free.map((z) => z.freeThreshold as number));
  const names = free.filter((z) => z.freeThreshold === threshold).map((z) => z.name);
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[15px] bg-ink-dark">
        <ParallaxImage src="/images/hero/hero-3.jpg" alt="" fill sizes="1300px" strength={30} wrapperClassName="absolute! inset-0" />
        <div className="absolute inset-0 bg-linear-to-r from-primary-dark/95 via-primary/80 to-black/70" />
        <div className="relative flex min-h-[107px] flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 py-6 text-center text-[14px] leading-[24px] text-white sm:gap-x-3 sm:py-5 sm:text-[18px] sm:leading-[32.4px]">
          <Float>
            <Truck size={30} variant="Bold" className="text-sun" />
          </Float>
          <span className="font-semibold uppercase text-sun">Livraison offerte</span>
          <span>dès {formatPrice(threshold)} d’achat {names.length === free.length && free.length === zones?.length ? "partout où nous livrons" : `à ${list(names)}`}.</span>
          <Link href={ROUTES.guide} className="link-underline ml-0 basis-full py-1 text-[14px] font-semibold leading-[25px] sm:ml-6 sm:basis-auto sm:font-normal">
            Zones et délais de livraison
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
