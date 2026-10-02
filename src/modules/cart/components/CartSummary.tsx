"use client";

import { Gift, InfoCircle, Messages2, ShieldTick } from "iconsax-reactjs";
import type { ReactNode } from "react";
import { CountUp } from "@/shared/animations/CountUp";
import { formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";

interface Props {
  subtotal: number;
  savings: number;
  count: number;
  /** Boutons d'action (CTA) */
  actions?: ReactNode;
  title?: string;
}

/** Récapitulatif de commande (panier & checkout). */
export function CartSummary({ subtotal, savings, count, actions, title = "Récapitulatif" }: Props) {
  const freeFrom = 199;
  const remaining = Math.max(0, freeFrom - subtotal);
  const progress = Math.min(100, (subtotal / freeFrom) * 100);

  return (
    <Block pad="none" className="p-4 sm:p-[30px] lg:sticky lg:top-4">
      <h2 className="text-section uppercase">{title}</h2>

      <div className="mt-4 rounded-box bg-primary-50 p-3.5 sm:mt-5 sm:p-4">
        <p className="flex items-center gap-2 text-[13px] leading-[19px]">
          <Gift size={18} variant="Bold" className="shrink-0 text-primary" />
          {remaining > 0 ? <span>Plus que <strong>{formatPrice(remaining)}</strong> pour la livraison offerte</span> : <strong className="text-primary">Livraison offerte débloquée !</strong>}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-[14px]">
        <div className="flex justify-between"><dt className="text-ink-2">Articles ({count})</dt><dd className="font-semibold">{formatPrice(subtotal + savings)}</dd></div>
        {savings > 0 && <div className="flex justify-between"><dt className="text-ink-2">Remises</dt><dd className="font-semibold text-danger">-{formatPrice(savings)}</dd></div>}
        <div className="flex justify-between"><dt className="text-ink-2">Livraison</dt><dd className="font-semibold">{remaining > 0 ? "Selon zone" : "Offerte"}</dd></div>
        <div className="flex items-end justify-between border-t border-line-3 pt-4">
          <dt className="text-[16px] font-bold uppercase">Total</dt>
          <dd className="text-[24px] font-extrabold leading-[30px] text-primary sm:text-[28px] sm:leading-[32px]"><CountUp to={subtotal} duration={0.8} format={formatPrice} /></dd>
        </div>
      </dl>

      {actions && <div className="mt-6 space-y-3">{actions}</div>}

      <details className="group mt-4 border-t border-line-3 pt-2 sm:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[13px] font-bold">
          Comment ça se passe ?
          <span className="text-ink-3 transition-transform group-open:rotate-180">⌄</span>
        </summary>
      <ul className="mt-3 space-y-3 text-[13px] leading-[19px] text-ink-2 sm:mt-6 sm:border-t sm:border-line-3 sm:pt-5">
        <li className="flex gap-2.5"><Messages2 size={18} variant="Bold" className="shrink-0 text-primary" />Votre commande ouvre une discussion avec un revendeur Celebobo pour confirmer le stock et la livraison.</li>
        <li className="flex gap-2.5"><ShieldTick size={18} variant="Bold" className="shrink-0 text-primary" />Paiement par Mobile Money (Orange, Airtel, M-Pesa) ou cash à la livraison — rien n&apos;est débité en ligne.</li>
        <li className="flex gap-2.5"><InfoCircle size={18} variant="Bold" className="shrink-0 text-primary" />Les prix peuvent être ajustés par le revendeur lors de la confirmation.</li>
      </ul>
      </details>
      <div className="hidden sm:block">
      <ul className="mt-3 space-y-3 text-[13px] leading-[19px] text-ink-2 sm:mt-6 sm:border-t sm:border-line-3 sm:pt-5">
        <li className="flex gap-2.5"><Messages2 size={18} variant="Bold" className="shrink-0 text-primary" />Votre commande ouvre une discussion avec un revendeur Celebobo pour confirmer le stock et la livraison.</li>
        <li className="flex gap-2.5"><ShieldTick size={18} variant="Bold" className="shrink-0 text-primary" />Paiement par Mobile Money (Orange, Airtel, M-Pesa) ou cash à la livraison — rien n&apos;est débité en ligne.</li>
        <li className="flex gap-2.5"><InfoCircle size={18} variant="Bold" className="shrink-0 text-primary" />Les prix peuvent être ajustés par le revendeur lors de la confirmation.</li>
      </ul>
      </div>
    </Block>
  );
}
