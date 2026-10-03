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
import { Skeleton } from "@/shared/ui/Skeleton";
import { useOrder } from "../hooks/useOrders";
import type { Order } from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { AvailabilityDot } from "./AvailabilityDot";
import { OrderProgress } from "./OrderTimeline";
import { useResellerAvailability } from "../hooks/useResellerAvailability";

/** Carte de commande (liste) : les lignes et la discussion sont chargées au dépliage (la liste ne renvoie qu'un résumé). */
export function OrderCard({ order: summary, defaultOpen = false }: { order: Order; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const number = summary.number ?? String(summary.id);
  const { data: detail, isLoading } = useOrder(summary.number, open && summary.items.length === 0);
  const order = detail ?? summary;
  const count = summary.itemsCount ?? order.items.reduce((n, i) => n + i.quantity, 0);
  const liveAvailability = useResellerAvailability(order.assignedRevendeur?.id || undefined);
  const availability = liveAvailability ?? order.assignedRevendeur?.availability ?? undefined;
  const thumbs = order.items.length ? order.items.map((it) => ({ id: it.id, image: it.productImage, name: it.productName })) : summary.previewImage ? [{ id: 0, image: summary.previewImage, name: summary.previewName ?? "" }] : [];

  return (
    <article className="overflow-hidden rounded-box border border-line-3 bg-white transition-colors hover:border-primary/40">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 p-4 sm:flex sm:flex-wrap sm:gap-x-8 sm:px-6">
        <div className="min-w-0 max-sm:col-start-1 max-sm:row-start-1 sm:min-w-[110px]">
          <p className="text-[12px] uppercase text-ink-3">Commande</p>
          <Link href={ROUTES.orderDetail(number)} className="inline-flex min-h-9 items-center pr-3 text-[16px] font-bold hover:text-primary">{number}</Link>
        </div>
        <div className="min-w-0 max-sm:col-start-1 max-sm:row-start-2 sm:min-w-[130px]">
          <p className="text-[12px] uppercase text-ink-3">Passée le</p>
          <p className="text-[14px] font-semibold">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="max-sm:col-start-2 max-sm:row-start-2 max-sm:text-right">
          <p className="text-[12px] uppercase text-ink-3">Total</p>
          <p className="text-[16px] font-bold text-primary">{formatPrice(order.totalPrice)}</p>
        </div>
        <div className="flex -space-x-3 max-sm:col-span-2 max-sm:row-start-3">
          {thumbs.slice(0, 3).map((it) => (
            <span key={it.id} className="relative size-11 overflow-hidden rounded-full border-2 border-white bg-page">
              {it.image && <Image src={it.image} alt={it.name} fill sizes="44px" className="object-cover" />}
            </span>
          ))}
          {thumbs.length > 3 && <span className="grid size-11 place-items-center rounded-full border-2 border-white bg-chip text-[12px] font-bold">+{thumbs.length - 3}</span>}
          {!order.items.length && summary.previewName && <span className="ml-5 hidden max-w-[220px] self-center truncate text-[13px] text-ink-2 lg:block">{summary.previewName}{count > 1 ? ` + ${count - 1}` : ""}</span>}
        </div>
        <div className="flex items-center justify-end gap-2 max-sm:col-start-2 max-sm:row-start-1 sm:ml-auto sm:gap-3">
          <OrderStatusBadge status={order.status} />
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Détails de la commande" className="grid size-11 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white active:scale-90 sm:size-9">
            <ArrowDown2 size={16} className={cn("transition-transform duration-300", open && "rotate-180")} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="grid gap-5 border-t border-line-3 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className="mb-3 text-[13px] font-bold uppercase text-ink-2">{pluralize(count, "article")}</p>
                {isLoading && <Skeleton className="h-[120px] w-full !rounded-box" />}
                <ul className="divide-y divide-line-3">
                  {order.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 py-3">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-page">
                        {it.productImage && <Image src={it.productImage} alt="" fill sizes="56px" className="object-cover" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        {it.productSlug ? (
                          <Link href={ROUTES.product(it.productSlug)} className="line-clamp-2 text-[14px] font-bold leading-[18px] hover:text-primary">{it.productName}</Link>
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
                  <Button href={ROUTES.orderDetail(number)} fullWidth variant="dark" rightIcon={<ArrowRight2 size={16} />}>Voir le suivi détaillé</Button>
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
