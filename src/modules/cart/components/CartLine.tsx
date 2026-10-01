"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
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
      className="grid grid-cols-[88px_1fr] items-center gap-x-4 gap-y-3 overflow-hidden border-b border-line-3 py-5 last:border-b-0 sm:grid-cols-[110px_1fr_auto_110px_40px]"
    >
      <Link href={href} className="group relative block size-[88px] overflow-hidden rounded-box bg-page sm:size-[110px]">
        {item.product.image && <Image src={item.product.image} alt={item.product.name} fill sizes="110px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
      </Link>

      <div className="min-w-0">
        {item.product.category && <p className="text-[12px] uppercase text-ink-3">{item.product.category}</p>}
        <Link href={href} className="line-clamp-2 text-[15px] font-bold leading-[20px] transition-colors hover:text-primary">{item.product.name}</Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Price current={unit} original={original} size="sm" />
          {item.product.freeShipping && <Pill tone="green">Livraison offerte</Pill>}
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:contents">
        <QuantityStepper value={item.quantity} onChange={onQuantity} size="sm" />
        <div className="text-right sm:w-[110px]">
          <p className="text-[12px] text-ink-3 sm:hidden">Total</p>
          <motion.p key={item.quantity} initial={{ scale: 1.15, color: "#1ABA1A" }} animate={{ scale: 1, color: "#000" }} className="text-[17px] font-bold">
            {formatPrice(unit * item.quantity)}
          </motion.p>
        </div>
        <button onClick={onRemove} aria-label={`Retirer ${item.product.name}`} className="grid size-10 place-items-center rounded-full bg-chip text-ink-2 transition-colors hover:bg-danger hover:text-white">
          <Trash size={17} />
        </button>
      </div>
    </motion.li>
  );
}
