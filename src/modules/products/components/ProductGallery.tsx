"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Maximize4 } from "iconsax-reactjs";
import { useState, type MouseEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { NewBadge, SaveBadge } from "@/shared/ui/Badges";
import { Modal } from "@/shared/ui/Overlay";
import type { Product } from "../types";
import { getPricing, isNew } from "../utils";

/** Galerie : miniatures verticales, image principale avec zoom au survol, fondu entre images, lightbox. */
export function ProductGallery({ product }: { product: Product }) {
  const images = product.images.length ? product.images : product.image ? [product.image] : [];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [light, setLight] = useState(false);
  const pricing = getPricing(product);
  const current = images[index];

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-4">
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto md:max-h-[480px] md:w-[76px] md:flex-col md:overflow-y-auto no-scrollbar">
          {images.map((src, i) => (
            <button
              key={src}
              aria-label={`Image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn("relative size-[64px] shrink-0 overflow-hidden rounded-md border-2 bg-page/40 transition-all md:size-[76px]", i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}
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
                priority
                sizes="(min-width:1024px) 520px, 100vw"
                className="object-cover transition-transform duration-200 ease-out"
                style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute left-3 top-3 z-10">{pricing.onSale ? <SaveBadge amount={pricing.saving} large /> : isNew(product) ? <NewBadge /> : null}</div>
        <span className="absolute bottom-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize4 size={18} />
        </span>
      </div>

      <Modal open={light} onClose={() => setLight(false)} title={product.name} className="max-w-[900px]">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-box bg-page/40">
          {current && <Image src={current} alt={product.name} fill sizes="900px" className="object-contain" />}
        </div>
      </Modal>
    </div>
  );
}
