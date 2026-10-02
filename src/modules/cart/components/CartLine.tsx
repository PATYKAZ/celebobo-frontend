"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { Trash } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { formatPrice } from "@/shared/lib/format";
import { Price } from "@/shared/ui/Price";
import { QuantityStepper } from "@/shared/ui/QuantityStepper";
import { Pill } from "@/shared/ui/Badges";
import { unitPrice, type CartItem } from "../types";

interface Props {
  item: CartItem;
  onQuantity: (q: number) => void;
  onRemove: () => void;
}

export function CartLine({ item, onQuantity, onRemove }: Props) {
  const mobile = useMediaQuery("(max-width: 639px)");
  const unit = unitPrice(item);
  const original = unit < item.product.price ? item.product.price : null;
  const href = ROUTES.product(item.productId);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 overflow-hidden border-b border-line-3 py-4 last:border-b-0 sm:grid-cols-[110px_minmax(0,1fr)_auto_110px_40px] sm:gap-x-4 sm:py-5"
    >
      <Link href={href} className="group relative block size-[76px] overflow-hidden rounded-box bg-page sm:size-[110px]">
        {item.product.image && <Image src={item.product.image} alt={item.product.name} fill sizes="110px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
      </Link>

      <div className="min-w-0">
        {item.product.category && <p className="text-[12px] uppercase text-ink-3">{item.product.category}</p>}
        <Link href={href} className="line-clamp-2 text-[14px] font-bold leading-[19px] transition-colors hover:text-primary sm:text-[15px] sm:leading-[20px]">{item.product.name}</Link>
        {item.variantLabel && <span className="mt-1 inline-block rounded bg-chip px-2 py-0.5 text-[12px] font-semibold">{item.variantLabel}</span>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Price current={unit} original={original} size="sm" />
          {item.product.freeShipping && <Pill tone="green">Livraison offerte</Pill>}
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:contents">
        <QuantityStepper value={item.quantity} onChange={onQuantity} size={mobile ? "md" : "sm"} />
        <div className="text-right sm:w-[110px]">
          <p className="text-[11px] uppercase text-ink-3 sm:hidden">Total</p>
          <motion.p key={item.quantity} initial={{ scale: 1.15, color: "#1ABA1A" }} animate={{ scale: 1, color: "#000" }} className="text-[17px] font-bold">
            {formatPrice(unit * item.quantity)}
          </motion.p>
        </div>
        <button onClick={onRemove} aria-label={`Retirer ${item.product.name}${item.variantLabel ? ` (${item.variantLabel})` : ""}`} className="grid size-11 place-items-center rounded-full bg-chip text-ink-2 transition-colors hover:bg-danger hover:text-white active:scale-90 sm:size-10">
          <Trash size={17} />
        </button>
      </div>
    </motion.li>
  );
}
