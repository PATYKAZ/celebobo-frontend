"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown2, ArrowRight2, Messages2, Profile } from "iconsax-reactjs";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDateTime, formatPrice, pluralize } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import type { Order } from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { AvailabilityDot } from "./AvailabilityDot";
import { OrderProgress } from "./OrderTimeline";
import { useResellerAvailability } from "../hooks/useResellerAvailability";

export function OrderCard({ order, defaultOpen = false }: { order: Order; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  const availability = useResellerAvailability(order.assignedRevendeur?.id);

  return (
    <article className="overflow-hidden rounded-box border border-line-3 bg-white transition-colors hover:border-primary/40">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4 sm:px-6">
        <div className="min-w-[110px]">
          <p className="text-[12px] uppercase text-ink-3">Commande</p>
          <Link href={ROUTES.orderDetail(order.id)} className="text-[16px] font-bold hover:text-primary">#{order.id}</Link>
        </div>
        <div className="min-w-[130px]">
          <p className="text-[12px] uppercase text-ink-3">Passée le</p>
          <p className="text-[14px] font-semibold">{formatDateTime(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-[12px] uppercase text-ink-3">Total</p>
          <p className="text-[16px] font-bold text-primary">{formatPrice(order.totalPrice)}</p>
        </div>
        <div className="flex -space-x-3">
          {order.items.slice(0, 3).map((it) => (
            <span key={it.id} className="relative size-11 overflow-hidden rounded-full border-2 border-white bg-page">
              {it.productImage && <Image src={it.productImage} alt={it.productName} fill sizes="44px" className="object-cover" />}
            </span>
          ))}
          {order.items.length > 3 && <span className="grid size-11 place-items-center rounded-full border-2 border-white bg-chip text-[12px] font-bold">+{order.items.length - 3}</span>}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Détails de la commande" className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white">
            <ArrowDown2 size={16} className={cn("transition-transform duration-300", open && "rotate-180")} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="grid gap-6 border-t border-line-3 p-4 sm:p-6 lg:grid-cols-[1fr_320px]">
              <div>
                <p className="mb-3 text-[13px] font-bold uppercase text-ink-2">{pluralize(count, "article")}</p>
                <ul className="divide-y divide-line-3">
                  {order.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 py-3">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-page">
                        {it.productImage && <Image src={it.productImage} alt="" fill sizes="56px" className="object-cover" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        {it.productId ? (
                          <Link href={ROUTES.product(it.productId)} className="line-clamp-2 text-[14px] font-bold leading-[18px] hover:text-primary">{it.productName}</Link>
                        ) : (
                          <p className="line-clamp-2 text-[14px] font-bold leading-[18px]">{it.productName}</p>
                        )}
                        <p className="text-[12px] text-ink-3">{it.variantLabel ? `${it.variantLabel} · ` : ""}{formatPrice(it.unitPrice)} × {it.quantity}</p>
                      </div>
                      <p className="text-[14px] font-semibold">{formatPrice(it.unitPrice * it.quantity)}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-5">
                <OrderProgress status={order.status} />
                <p className="flex items-center gap-2 rounded-md bg-page/60 px-3 py-2.5 text-[13px]">
                  <Profile size={16} className="text-ink-3" />
                  {order.assignedRevendeur ? <>Revendeur : <strong>{order.assignedRevendeur.name}</strong> <AvailabilityDot value={availability} /></> : <span className="text-ink-2">En attente d&apos;assignation à un revendeur</span>}
                </p>
                <div className="grid gap-2">
                  <Button href={ROUTES.orderDetail(order.id)} fullWidth variant="dark" rightIcon={<ArrowRight2 size={16} />}>Voir le suivi détaillé</Button>
                  {order.conversationId && (
                    <Button href={ROUTES.conversation(order.conversationId)} fullWidth variant="outline" leftIcon={<Messages2 size={16} variant="Bold" />}>Ouvrir la discussion</Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
