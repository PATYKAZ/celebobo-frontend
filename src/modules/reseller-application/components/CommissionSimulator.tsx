"use client";

import { useState } from "react";
import { CountUp } from "@/shared/animations/CountUp";
import { formatPrice } from "@/shared/lib/format";
import { COMMISSION_RULES, MAX_COMMISSION_SHARE, maxCommission } from "../types";

/** Simulateur : « combien puis-je gagner ? » — curseur de ventes mensuelles → commission maximale (10 %). */
export function CommissionSimulator() {
  const [sales, setSales] = useState(1500);
  const amount = maxCommission(sales);
  const pct = (sales / 6000) * 100;

  return (
    <div className="rounded-box bg-ink-dark p-4 text-white sm:p-8">
      <p className="text-sm font-semibold text-white/60">Simulateur de gains</p>
      <p className="mt-3 text-sm text-white/80">Si je vends chaque mois pour…</p>
      <p className="mt-1 text-2xl font-bold text-sun sm:text-2xl">{formatPrice(sales)}</p>

      <input
        type="range"
        min={200}
        max={6000}
        step={100}
        value={sales}
        onChange={(e) => setSales(Number(e.target.value))}
        aria-label="Ventes mensuelles"
        className="mt-5 h-2 w-full cursor-pointer touch-pan-y appearance-none rounded-full accent-primary [&::-webkit-slider-thumb]:size-6"
        style={{ background: `linear-gradient(90deg,#226D68 ${pct}%,rgba(255,255,255,.18) ${pct}%)` }}
      />
      <div className="mt-1 flex justify-between text-xs text-white/50"><span>200 $</span><span>6 000 $</span></div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
        <div className="min-w-0 rounded-box bg-white/10 p-3 sm:p-4">
          <p className="text-xs text-white/60 sm:text-xs">Commission jusqu&apos;à / mois</p>
          <p className="mt-1 text-xl font-bold text-primary-light sm:text-2xl"><CountUp key={Math.round(amount)} to={amount} duration={0.6} format={formatPrice} /></p>
        </div>
        <div className="min-w-0 rounded-box bg-white/10 p-3 sm:p-4">
          <p className="text-xs text-white/60 sm:text-xs">Part maximale</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl">{Math.round(MAX_COMMISSION_SHARE * 100)} % du payé</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5 text-center text-xs sm:mt-5 sm:gap-2 sm:text-xs">
        {COMMISSION_RULES.map((r) => (
          <div key={r.title} className="min-w-0 rounded-md border border-white/15 px-1.5 py-2 sm:px-2 sm:py-2.5">
            <strong className="block text-sm">{r.title}</strong>
            {r.text}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-white/50">Montant maximal : la commission de chaque vente est le plus petit des deux plafonds, calculé sur ce que le client paie réellement. Les mêmes règles s&apos;appliquent à tous les revendeurs.</p>
    </div>
  );
}
