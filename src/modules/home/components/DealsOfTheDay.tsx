"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Add, Gift, RecordCircle } from "@/shared/ui/icons";
import { CountUp } from "@/shared/animations/CountUp";
import { useCountdown } from "@/shared/hooks/useCountdown";
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
import { getPricing } from "@/modules/products/utils";
import type { HomeContent, HomeDeal } from "../types";
import { BannerPrice, bannerTone } from "./BannerBits";
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

/** Chiffre qui « tourne » quand sa valeur change. */
function FlipNumber({ value }: { value: number }) {
  const text = String(value).padStart(2, "0");
  return (
    <span className="relative inline-block h-[30px] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={text} initial={{ y: "-100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="block tabular-nums">
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Countdown({ endsAt }: { endsAt: string }) {
  const c = useCountdown(endsAt);
  if (c.done) return <p className="text-[14px] font-bold text-danger">Offre terminée</p>;
  const cells = [
    { v: c.days, u: "j", label: "jours" },
    { v: c.hours, u: "h", label: "heures" },
    { v: c.minutes, u: "m", label: "minutes" },
    { v: c.seconds, u: "s", label: "secondes" },
  ];
  return (
    <div role="timer" aria-label={`Fin de l'offre dans ${c.days} jours, ${c.hours} heures et ${c.minutes} minutes`} className="grid grid-cols-4 gap-2 sm:flex sm:gap-2.5">
      {cells.map((x) => (
        <div key={x.u} aria-hidden className="flex h-[74px] w-full flex-col items-center rounded-md bg-chip-2 pt-[7px] sm:w-[56px]">
          <span className="text-[20px] font-bold leading-[30px]">
            <FlipNumber value={x.v} />
          </span>
          <span className="text-[14px] font-bold leading-[21px] text-ink-2">{x.u}</span>
        </div>
      ))}
    </div>
  );
}

const endFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/**
 * Offre du jour. Programmée dans l'admin : prix de l'offre (appliqué jusqu'au paiement), compte à rebours jusqu'à sa
 * fin, unités vendues sur la quantité prévue, cadeau. Sans offre programmée : la promotion la plus vendue, sans date.
 */
function DealCard({ deal }: { deal: HomeDeal }) {
  const { add } = useCart();
  const formatPrice = useFormatPrice();
  const [active, setActive] = useState(0);
  const { product, variant } = deal;
  const onSale = deal.regularPrice > deal.dealPrice;
  const saving = onSale ? deal.regularPrice - deal.dealPrice : 0;
  const percent = onSale ? Math.round((saving / deal.regularPrice) * 100) : 0;
  const left = deal.quantity != null ? Math.max(0, deal.quantity - (deal.sold ?? 0)) : null;
  const inStock = (variant ? variant.stock > 0 : product.inStock) && left !== 0;
  const pct = deal.quantity ? Math.min(100, Math.round(((deal.sold ?? 0) / deal.quantity) * 100)) : 0;
  const gallery = [...new Set([variant?.image, ...product.images].filter((x): x is string => !!x))];
  const addToCart = () => add(product, 1, variant ? { variantId: variant.id, variantLabel: variant.label, priceDelta: deal.dealPrice - product.price } : undefined);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 rounded-b-box bg-surface p-4 sm:gap-6 sm:p-[30px] lg:grid-cols-[minmax(0,441px)_minmax(0,1fr)] lg:gap-[34px]">
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
          {onSale && <SaveBadge large amount={saving} className="absolute left-3 top-3 z-10" />}
          <button onClick={addToCart} disabled={!inStock} aria-label="Ajouter au panier" className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-pill bg-chip-2 transition-all hover:rotate-90 hover:bg-primary hover:text-white disabled:pointer-events-none disabled:opacity-40 sm:size-[30px]">
            <Add size={16} />
          </button>
        </div>
      </div>

      {/* Infos */}
      <div className="min-w-0">
        <Stars rating={product.rating ?? 5} count={product.reviewsCount} />
        <Link href={ROUTES.product(product.slug)} className="mt-2 block text-[16px] font-bold leading-[19.2px] transition-colors hover:text-primary">
          {product.name}
          {variant && <span className="font-semibold text-ink-2"> · {variant.label}</span>}
        </Link>
        <Price current={deal.dealPrice} original={onSale ? deal.regularPrice : null} size="lg" className="mt-4" />
        <ul className="mt-4 space-y-1">
          {product.features.slice(0, 3).map((f) => (
            <li key={f} className="flex items-center gap-2 text-[12px] leading-[21.6px]">
              <RecordCircle size={10} variant="Bold" className="text-ink-2" /> {f}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {onSale && <Pill tone="red" className="h-7 px-[15px] text-[12px]">−{percent} %</Pill>}
          {deal.giftLabel && (
            <Pill tone="red" className="h-7 gap-1.5 px-[15px] text-[12px]">
              <Gift size={14} variant="Bold" /> {deal.giftLabel}
            </Pill>
          )}
          {product.freeShipping && <Pill tone="green" className="h-7 px-[15px] text-[12px]">Livraison offerte</Pill>}
          <Pill tone={inStock ? "green" : "red"} className="h-7 px-[15px] text-[12px]">{inStock ? "En stock" : "Épuisé"}</Pill>
        </div>

        {deal.endsAt && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <p className="text-[13px] font-medium uppercase leading-[19.5px] sm:max-w-[130px]" title={`Jusqu'au ${endFmt.format(new Date(deal.endsAt))}`}>
              Dépêchez-vous ! L’offre se termine dans
            </p>
            <Countdown endsAt={deal.endsAt} />
          </div>
        )}

        <div className="mt-5 border-t border-line-3 pt-5 sm:mt-6">
          {deal.quantity != null && (
            <div className="h-2 overflow-hidden rounded-full bg-page" role="progressbar" aria-label="Unités vendues" aria-valuemin={0} aria-valuemax={deal.quantity} aria-valuenow={deal.sold ?? 0}>
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} className="relative h-full rounded-full bg-primary">
                <span className="absolute inset-y-0 right-0 w-8 animate-shimmer bg-linear-to-r from-transparent via-white/50 to-transparent bg-size-[200%_100%]" />
              </motion.div>
            </div>
          )}
          <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", deal.quantity != null && "mt-3")}>
            <p className="text-[13px] leading-[22px] text-ink-2">
              {deal.quantity != null ? (
                <>
                  Vendus : <strong className="text-ink"><CountUp to={deal.sold ?? 0} />/{deal.quantity}</strong>
                  {left ? <> · plus que {left}</> : null}
                </>
              ) : onSale ? (
                <>Vous économisez <strong className="text-ink">{formatPrice(saving)}</strong> sur le prix habituel.</>
              ) : (
                "Prix Celebobo, livraison suivie jusqu'à chez vous."
              )}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" href={ROUTES.product(product.slug)} className="max-sm:flex-1">Voir</Button>
              <Button size="sm" onClick={addToCart} disabled={!inStock} className="max-sm:flex-1 max-sm:px-8">Ajouter</Button>
            </div>
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
          <DealCard deal={picks.deal} />
        ) : (
          <div className="rounded-b-box bg-surface p-6 text-center text-[14px] text-ink-2 sm:p-10">Pas de promotion en ce moment. Revenez bientôt !</div>
        )}
      </div>

      <div className="max-sm:snap-row max-sm:mx-[-15px] max-sm:scroll-px-[15px] max-sm:px-[15px] sm:grid sm:grid-cols-3 sm:gap-4 xl:grid-cols-1 xl:grid-rows-3">
        {picks
          ? picks.side.map((b, i) => {
              const t = bannerTone(b, "from-black/80 via-black/40 to-transparent");
              return (
                <Reveal key={b.key} delay={i * 0.1} className="h-full min-h-[150px] max-sm:w-[78%] sm:min-h-[170px]">
                  <PhotoBanner image={b.image} href={b.href} label={b.title} overlay={t.overlay} direction="t" className="h-full rounded-[12px]" sizes="296px" contentClassName="flex flex-col justify-end p-5">
                    {b.eyebrow && <p className={cn("text-[10px] uppercase tracking-[0.2em]", t.muted)}>{b.eyebrow}</p>}
                    <p className={cn("mt-1 line-clamp-2 whitespace-pre-line text-[17px] font-semibold leading-[21px]", t.text)}>{b.title}</p>
                    {b.product ? (
                      <p className="mt-0.5"><BannerPrice product={b.product} className={cn("text-[15px]", t.price)} strikeClassName={t.strike} /></p>
                    ) : (
                      b.subtitle && <p className={cn("mt-0.5 line-clamp-1 text-[12px]", t.muted)}>{b.subtitle}</p>
                    )}
                  </PhotoBanner>
                </Reveal>
              );
            })
          : [0, 1, 2].map((i) => <Skeleton key={i} className="min-h-[150px] rounded-[12px] max-sm:w-[78%] sm:min-h-[170px]" />)}
      </div>
    </section>
  );
}
