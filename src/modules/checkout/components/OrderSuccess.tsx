"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, Messages2, Receipt2 } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { formatPrice, pluralize } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import type { Order } from "@/modules/orders/types";

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({ id: i, x: Math.cos((i / 14) * Math.PI * 2) * 120, y: Math.sin((i / 14) * Math.PI * 2) * 120, c: ["#1ABA1A", "#FFE400", "#F1352B", "#FFA500"][i % 4] }));

const NEXT_STEPS = [
  { title: "Un revendeur est assigné", text: "Le responsable attribue votre commande au revendeur le plus disponible." },
  { title: "Il vous contacte dans la discussion", text: "Disponibilité, prix final et modalités de livraison y sont confirmés." },
  { title: "Paiement & livraison", text: "Vous payez par Mobile Money ou en cash, puis recevez votre commande." },
];

/** Confirmation de commande : aucune redirection forcée — l'utilisateur choisit où aller. */
export function OrderSuccess({ order, conversationId }: { order: Order; conversationId: number | null }) {
  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  const number = order.number ?? String(order.id);
  return (
    <Block pad="none" className="px-4 py-8 sm:px-12 sm:py-12">
      <div className="text-center">
        <div className="relative mx-auto grid size-24 place-items-center sm:size-28">
          {CONFETTI.map((c) => (
            <motion.span key={c.id} className="absolute size-2.5 rounded-full" style={{ background: c.c }} initial={{ x: 0, y: 0, opacity: 1, scale: 0 }} animate={{ x: c.x, y: c.y, opacity: 0, scale: 1 }} transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }} />
          ))}
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="grid size-24 place-items-center rounded-full bg-primary sm:size-28">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3 }} />
            </svg>
          </motion.span>
        </div>
        <motion.h2 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 text-[24px] leading-[30px] sm:mt-8 sm:text-[28px] sm:leading-[34px]">Commande {number} envoyée !</motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="mx-auto mt-3 max-w-[480px] text-[14px] leading-[22px] text-ink-2">
          Merci {order.user.name.split(" ")[0]} ! Votre demande a bien été transmise à l&apos;équipe Celebobo.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
          {conversationId && <Button href={ROUTES.conversation(conversationId)} size="lg" className="max-sm:w-full" leftIcon={<Messages2 size={17} variant="Bold" />} rightIcon={<ArrowRight size={16} />}>Ouvrir la discussion</Button>}
          <Button href={ROUTES.orderDetail(number)} variant="dark" size="lg" className="max-sm:w-full" leftIcon={<Receipt2 size={17} variant="Bold" />}>Voir ma commande</Button>
          <Button href={ROUTES.products} variant="chip" size="lg" className="max-sm:w-full">Continuer mes achats</Button>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }} className="mx-auto mt-8 grid max-w-[900px] gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-box bg-page/60 p-4 sm:p-5">
          <p className="text-[12px] font-bold uppercase text-ink-3">Récapitulatif · {pluralize(count, "article")}</p>
          <ul className="mt-3 space-y-3">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-white">{it.productImage && <Image src={it.productImage} alt="" fill sizes="48px" className="object-cover" />}</span>
                <p className="min-w-0 flex-1 text-[13px] font-semibold leading-[17px]">
                  <span className="line-clamp-2">{it.productName}</span>
                  <span className="font-normal text-ink-3">{it.variantLabel ? `${it.variantLabel} · ` : ""}× {it.quantity}</span>
                </p>
                <p className="text-[13px] font-bold">{formatPrice(it.unitPrice * it.quantity)}</p>
              </li>
            ))}
          </ul>
          {!!order.discount && (
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[13px]">
              <span className="text-ink-2">Code promo{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span className="font-semibold text-danger">-{formatPrice(order.discount)}</span>
            </div>
          )}
          {order.shippingFee != null && (
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <span className="text-ink-2">Livraison{order.shippingZone ? ` · ${order.shippingZone}` : ""}</span>
              <span className="font-semibold">{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Offerte"}</span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-[13px] text-ink-2">Total</span>
            <span className="text-[20px] font-bold text-primary">{formatPrice(order.totalPrice)}</span>
          </div>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase text-ink-3">Et maintenant ?</p>
          <ol className="mt-3 space-y-4">
            {NEXT_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-[13px] font-bold text-white">{i + 1}</span>
                <p className="text-[13px] leading-[19px]"><strong className="block text-[14px]">{s.title}</strong><span className="text-ink-2">{s.text}</span></p>
              </li>
            ))}
          </ol>
        </div>
      </motion.div>
    </Block>
  );
}
