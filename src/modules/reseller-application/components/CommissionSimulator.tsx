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
    <div className="rounded-box bg-ink-dark p-6 text-white sm:p-8">
      <p className="text-[13px] font-semibold uppercase tracking-wider text-white/60">Simulateur de gains</p>
      <p className="mt-3 text-[15px] text-white/80">Si je vends chaque mois pour…</p>
      <p className="mt-1 text-[40px] font-extrabold leading-[46px] text-sun">{formatPrice(sales)}</p>

      <input
        type="range"
        min={200}
        max={6000}
        step={100}
        value={sales}
        onChange={(e) => setSales(Number(e.target.value))}
        aria-label="Ventes mensuelles"
        className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full accent-primary"
        style={{ background: `linear-gradient(90deg,#1ABA1A ${pct}%,rgba(255,255,255,.18) ${pct}%)` }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-white/50"><span>$200</span><span>$6,000</span></div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-box bg-white/10 p-4">
          <p className="text-[12px] uppercase text-white/60">Commission estimée / mois</p>
          <p className="mt-1 text-[28px] font-bold leading-[34px] text-primary-light"><CountUp key={Math.round(amount)} to={amount} duration={0.6} format={formatPrice} /></p>
        </div>
        <div className="rounded-box bg-white/10 p-4">
          <p className="text-[12px] uppercase text-white/60">Palier atteint</p>
          <p className="mt-1 text-[28px] font-bold leading-[34px]">{tier.label} · {Math.round(tier.rate * 100)} %</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[12px]">
        {COMMISSION_TIERS.map((t) => (
          <motion.div key={t.label} animate={{ opacity: t.label === tier.label ? 1 : 0.45, scale: t.label === tier.label ? 1 : 0.97 }} className={cn("rounded-md border px-2 py-2.5", t.label === tier.label ? "border-primary bg-primary/20" : "border-white/15")}>
            <strong className="block text-[15px]">{Math.round(t.rate * 100)} %</strong>
            {t.to === Infinity ? `> ${formatPrice(t.from)}` : `${formatPrice(t.from)} – ${formatPrice(t.to)}`}
          </motion.div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-white/50">Estimation indicative. Le taux définitif est confirmé par le responsable à l&apos;activation de votre compte.</p>
    </div>
  );
}
