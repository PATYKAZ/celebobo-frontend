"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { CountUp } from "@/shared/animations/CountUp";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { COMMISSION_TIERS, estimateCommission } from "../types";

/** Simulateur : « combien puis-je gagner ? » — curseur de ventes mensuelles → commission estimée par palier. */
export function CommissionSimulator() {
  const [sales, setSales] = useState(1500);
  const { tier, amount } = estimateCommission(sales);
  const pct = (sales / 6000) * 100;

  return (
    <div className="rounded-box bg-ink-dark p-4 text-white sm:p-8">
      <p className="text-[13px] font-semibold uppercase tracking-wider text-white/60">Simulateur de gains</p>
      <p className="mt-3 text-[15px] text-white/80">Si je vends chaque mois pour…</p>
      <p className="mt-1 text-[34px] font-extrabold leading-[40px] text-sun sm:text-[40px] sm:leading-[46px]">{formatPrice(sales)}</p>

      <input
        type="range"
        min={200}
        max={6000}
        step={100}
        value={sales}
        onChange={(e) => setSales(Number(e.target.value))}
        aria-label="Ventes mensuelles"
        className="mt-5 h-2 w-full cursor-pointer touch-pan-y appearance-none rounded-full accent-primary [&::-webkit-slider-thumb]:size-6"
        style={{ background: `linear-gradient(90deg,#1ABA1A ${pct}%,rgba(255,255,255,.18) ${pct}%)` }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-white/50"><span>$200</span><span>$6,000</span></div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
        <div className="min-w-0 rounded-box bg-white/10 p-3 sm:p-4">
          <p className="text-[11px] uppercase leading-[14px] text-white/60 sm:text-[12px]">Commission estimée / mois</p>
          <p className="mt-1 text-[22px] font-bold leading-[28px] text-primary-light sm:text-[28px] sm:leading-[34px]"><CountUp key={Math.round(amount)} to={amount} duration={0.6} format={formatPrice} /></p>
        </div>
        <div className="min-w-0 rounded-box bg-white/10 p-3 sm:p-4">
          <p className="text-[11px] uppercase leading-[14px] text-white/60 sm:text-[12px]">Palier atteint</p>
          <p className="mt-1 text-[22px] font-bold leading-[28px] sm:text-[28px] sm:leading-[34px]">{tier.label} · {Math.round(tier.rate * 100)} %</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5 text-center text-[11px] leading-[15px] sm:mt-5 sm:gap-2 sm:text-[12px]">
        {COMMISSION_TIERS.map((t) => (
          <motion.div key={t.label} animate={{ opacity: t.label === tier.label ? 1 : 0.45, scale: t.label === tier.label ? 1 : 0.97 }} className={cn("min-w-0 rounded-md border px-1.5 py-2 sm:px-2 sm:py-2.5", t.label === tier.label ? "border-primary bg-primary/20" : "border-white/15")}>
            <strong className="block text-[15px]">{Math.round(t.rate * 100)} %</strong>
            {t.to === Infinity ? `> ${formatPrice(t.from)}` : `${formatPrice(t.from)} – ${formatPrice(t.to)}`}
          </motion.div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-white/50">Estimation indicative. Le taux définitif est confirmé par le responsable à l&apos;activation de votre compte.</p>
    </div>
  );
}
