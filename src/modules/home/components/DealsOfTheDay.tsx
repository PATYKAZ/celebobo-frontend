"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Add, RecordCircle } from "@/shared/ui/icons";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";
import { SaveBadge, Pill } from "@/shared/ui/Badges";
import { Button } from "@/shared/ui/Button";
import { Price } from "@/shared/ui/Price";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Stars } from "@/shared/ui/Stars";
import { useCart } from "@/modules/cart/hooks/useCart";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import type { HomeContent } from "../types";
import { PhotoBanner } from "./PhotoBanner";

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [origin, setOrigin] = useState("50% 50%");
  const [hover, setHover] = useState(false);
  const move = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <div className="relative size-full cursor-zoom-in overflow-hidden rounded-box bg-page/50" onMouseMove={move} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <AnimatePresence mode="popLayout">
        <motion.div key={src} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
          <Image src={src} alt={alt} fill sizes="405px" className="object-cover transition-transform duration-300 ease-out" style={{ transform: hover ? "scale(1.7)" : "scale(1)", transformOrigin: origin }} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Offre du jour : la promotion la plus vendue du moment. Tout ce qui est affiché vient du produit (prix, économie,
 * livraison offerte, stock) ; pas de compte à rebours ni de « vendus x/y » tant que l'API ne gère pas de vraie
 * offre datée et limitée (cf. docs/BACKEND_CHANGES.md).
 */
function DealCard({ product }: { product: Product }) {
  const { add } = useCart();
  const formatPrice = useFormatPrice();
  const [active, setActive] = useState(0);
  const pricing = getPricing(product);
  const gallery = product.images.length ? product.images : product.image ? [product.image] : [];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 rounded-b-box bg-white p-4 sm:gap-6 sm:p-[30px] lg:grid-cols-[minmax(0,441px)_minmax(0,1fr)] lg:gap-[34px]">
      {/* Galerie */}
      <div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row">
        <div className="no-scrollbar flex shrink-0 gap-2.5 overflow-x-auto sm:w-[35px] sm:flex-col sm:gap-4 sm:overflow-visible">
          {gallery.map((g, i) => (
            <button key={g} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`} className={cn("relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all sm:h-[60px] sm:w-[35px] sm:border", i === active ? "border-primary" : "border-transparent opacity-60 hover:opacity-100")}>
              <Image src={g} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="relative aspect-4/3 w-full min-w-0 sm:aspect-405/330 sm:flex-1">
          {gallery[active] && <ZoomImage src={gallery[active]} alt={product.name} />}
          {pricing.onSale && <SaveBadge large amount={pricing.saving} className="absolute left-3 top-3 z-10" />}
          <button onClick={() => add(product)} aria-label="Ajouter au panier" className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-pill bg-chip-2 sm:size-[30px] transition-all hover:rotate-90 hover:bg-primary hover:text-white">
            <Add size={16} />
          </button>
        </div>
      </div>

      {/* Infos */}
      <div className="min-w-0">
        <Stars rating={product.rating ?? 5} count={product.reviewsCount} />
        <Link href={ROUTES.product(product.slug)} className="mt-2 block text-[16px] font-bold leading-[19.2px] transition-colors hover:text-primary">
          {product.name}
        </Link>
        <Price current={pricing.current} original={pricing.original} size="lg" className="mt-4" />
        <ul className="mt-4 space-y-1">
          {product.features.slice(0, 3).map((f) => (
            <li key={f} className="flex items-center gap-2 text-[12px] leading-[21.6px]">
              <RecordCircle size={10} variant="Bold" className="text-ink-2" /> {f}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {pricing.onSale && <Pill tone="red" className="h-7 px-[15px] text-[12px]">−{pricing.percent} %</Pill>}
          {product.freeShipping && <Pill tone="green" className="h-7 px-[15px] text-[12px]">Livraison offerte</Pill>}
          <Pill tone={product.inStock ? "green" : "red"} className="h-7 px-[15px] text-[12px]">{product.inStock ? "En stock" : "Épuisé"}</Pill>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-line-3 pt-5 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-[22px] text-ink-2">
            {pricing.onSale ? (
              <>Vous économisez <strong className="text-ink">{formatPrice(pricing.saving)}</strong> sur le prix habituel.</>
            ) : (
              "Prix Celebobo, livraison suivie jusqu'à chez vous."
            )}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" href={ROUTES.product(product.slug)} className="max-sm:flex-1">Voir</Button>
            <Button size="sm" onClick={() => add(product)} disabled={!product.inStock} className="max-sm:flex-1 max-sm:px-8">Ajouter</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DealsOfTheDay({ content }: { content?: HomeContent }) {
  const picks = content?.picks;
  const formatPrice = useFormatPrice();

  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 xl:grid-cols-[minmax(0,971px)_minmax(0,1fr)]">
      <div>
        <div className="flex h-14 items-center rounded-t-box bg-primary px-4 sm:h-[62px] sm:px-[30px]">
          <SectionHeader title="Offres du jour" viewAllHref={`${ROUTES.products}?onSale=1`} onPrimary className="w-full" />
        </div>
        {!picks ? (
          <Skeleton className="h-[420px] rounded-b-box rounded-t-none" />
        ) : picks.deal ? (
          <DealCard product={picks.deal} />
        ) : (
          <div className="rounded-b-box bg-white p-6 text-center text-[14px] text-ink-2 sm:p-10">Pas de promotion en ce moment. Revenez bientôt !</div>
        )}
      </div>

      <div className="max-sm:snap-row max-sm:mx-[-15px] max-sm:scroll-px-[15px] max-sm:px-[15px] sm:grid sm:grid-cols-3 sm:gap-4 xl:grid-cols-1 xl:grid-rows-3">
        {picks
          ? picks.side.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.1} className="h-full min-h-[150px] max-sm:w-[78%] sm:min-h-[170px]">
                <PhotoBanner image={p.image as string} href={ROUTES.product(p.slug)} label={p.name} overlay="from-black/80 via-black/40 to-transparent" direction="t" className="h-full rounded-[12px]" sizes="296px" contentClassName="flex flex-col justify-end p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/80">{p.category}</p>
                  <p className="mt-1 line-clamp-2 text-[17px] font-semibold leading-[21px] text-white">{p.name}</p>
                  <p className="mt-0.5 text-[15px] font-bold text-sun">{formatPrice(getPricing(p).current)}</p>
                </PhotoBanner>
              </Reveal>
            ))
          : [0, 1, 2].map((i) => <Skeleton key={i} className="min-h-[150px] rounded-[12px] max-sm:w-[78%] sm:min-h-[170px]" />)}
      </div>
    </section>
  );
}
