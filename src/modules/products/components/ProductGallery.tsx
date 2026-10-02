"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Maximize4 } from "iconsax-reactjs";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { NewBadge, SaveBadge } from "@/shared/ui/Badges";
import { Modal } from "@/shared/ui/Overlay";
import type { Product } from "../types";
import { getPricing, isNew } from "../utils";

/**
 * Galerie.
 *  - Mobile (< md) : carrousel natif (swipe + accroche), points de pagination, tap = plein écran.
 *  - ≥ md : miniatures verticales, image principale avec zoom au survol, fondu entre images, lightbox.
 */
export function ProductGallery({ product, activeImage }: { product: Product; /** image propre à la variante choisie (mise en avant) */ activeImage?: string | null }) {
  const base = product.images.length ? product.images : product.image ? [product.image] : [];
  const images = activeImage && !base.includes(activeImage) ? [activeImage, ...base] : base;
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeImage) return;
    const i = Math.max(0, images.indexOf(activeImage));
    setIndex(i);
    track.current?.scrollTo({ left: i * (track.current.clientWidth || 0), behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImage]);

  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [light, setLight] = useState(false);
  const pricing = getPricing(product);
  const current = images[index];
  const badge = pricing.onSale ? <SaveBadge amount={pricing.saving} large /> : isNew(product) ? <NewBadge /> : null;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  // mobile : synchronise l'index avec le défilement
  const onScroll = () => {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <div className="min-w-0">
      {/* ───── Mobile : carrousel swipeable ───── */}
      <div className="relative md:hidden">
        <div ref={track} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-box bg-page/40">
          {images.map((src, i) => (
            <button key={src} onClick={() => setLight(true)} aria-label={`Agrandir l'image ${i + 1}`} className="relative aspect-square w-full shrink-0 snap-center">
              <Image src={src} alt={i === 0 ? product.name : ""} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute left-3 top-3 z-10">{badge}</div>
        <span className="pointer-events-none absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-white/90"><Maximize4 size={18} /></span>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Images du produit">
            {images.map((src, i) => (
              <button
                key={src}
                role="tab"
                aria-selected={i === index}
                aria-label={`Image ${i + 1}`}
                onClick={() => track.current?.scrollTo({ left: i * (track.current?.clientWidth ?? 0), behavior: "smooth" })}
                className="grid h-8 w-6 place-items-center"
              >
                <span className={cn("h-2 rounded-full transition-all duration-300", i === index ? "w-6 bg-primary" : "w-2 bg-line")} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ───── Desktop / tablette ───── */}
      <div className="hidden gap-4 md:flex">
        {images.length > 1 && (
          <div className="no-scrollbar flex max-h-[480px] w-[76px] flex-col gap-2 overflow-y-auto">
            {images.map((src, i) => (
              <button
                key={src}
                aria-label={`Image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn("relative size-[76px] shrink-0 overflow-hidden rounded-md border-2 bg-page/40 transition-all", i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}
              >
                <Image src={src} alt="" fill sizes="76px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div
          className="group relative aspect-square min-w-0 flex-1 cursor-zoom-in overflow-hidden rounded-box bg-page/40"
          onMouseMove={onMove}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLight(true)}
        >
          <AnimatePresence mode="popLayout">
            {current && (
              <motion.div key={current} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0">
                <Image
                  src={current}
                  alt={product.name}
                  fill
                  sizes="(min-width:1024px) 520px, 50vw"
                  className="object-cover transition-transform duration-200 ease-out"
                  style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute left-3 top-3 z-10">{badge}</div>
          <span className="absolute bottom-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize4 size={18} />
          </span>
        </div>
      </div>

      <Modal open={light} onClose={() => setLight(false)} title={product.name} className="max-w-[900px]">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-box bg-page/40">
          {current && <Image src={current} alt={product.name} fill sizes="(min-width:640px) 900px, 100vw" className="object-contain" />}
        </div>
      </Modal>
    </div>
  );
}
