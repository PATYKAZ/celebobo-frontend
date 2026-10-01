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
    <Block className="lg:sticky lg:top-4">
      <h2 className="text-section uppercase">{title}</h2>

      <div className="mt-5 rounded-box bg-primary-50 p-4">
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
          <dd className="text-[28px] font-extrabold leading-[32px] text-primary"><CountUp to={subtotal} duration={0.8} format={formatPrice} /></dd>
        </div>
      </dl>

      {actions && <div className="mt-6 space-y-3">{actions}</div>}

      <ul className="mt-6 space-y-3 border-t border-line-3 pt-5 text-[13px] leading-[19px] text-ink-2">
        <li className="flex gap-2.5"><Messages2 size={18} variant="Bold" className="shrink-0 text-primary" />Votre commande ouvre une discussion avec un revendeur Celebobo pour confirmer le stock et la livraison.</li>
        <li className="flex gap-2.5"><ShieldTick size={18} variant="Bold" className="shrink-0 text-primary" />Paiement par Mobile Money (Orange, Airtel, M-Pesa) ou cash à la livraison — rien n&apos;est débité en ligne.</li>
        <li className="flex gap-2.5"><InfoCircle size={18} variant="Bold" className="shrink-0 text-primary" />Les prix peuvent être ajustés par le revendeur lors de la confirmation.</li>
      </ul>
    </Block>
  );
}
