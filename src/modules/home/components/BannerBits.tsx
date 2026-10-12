"use client";

import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { cn } from "@/shared/lib/cn";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import type { HomeBanner } from "../types";

/**
 * Couleurs d'une bannière selon son ton. Image claire : voile clair et texte sombre sur desktop ; sur mobile,
 * PhotoBanner pose un voile sombre et repasse les textes `text-ink*` en blanc.
 */
export function bannerTone(b: Pick<HomeBanner, "tone">, darkOverlay: string) {
  const light = b.tone === "light";
  return {
    overlay: light ? "from-white/90 via-white/55 to-transparent" : darkOverlay,
    text: light ? "text-ink" : "text-white",
    muted: light ? "text-ink-2" : "text-white/80",
    price: light ? "text-sun sm:text-danger" : "text-sun",
    strike: light ? "text-ink-3" : "text-white/70",
  };
}

/** Vrai prix du produit rattaché (promotion barrée). */
export function BannerPrice({ product, className, strikeClassName }: { product: Product; className?: string; strikeClassName?: string }) {
  const formatPrice = useFormatPrice();
  const pricing = getPricing(product);
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={cn("font-bold", className)}>{formatPrice(pricing.current)}</span>
      {pricing.original != null && <s className={cn("text-[12px]", strikeClassName)}>{formatPrice(pricing.original)}</s>}
    </span>
  );
}
