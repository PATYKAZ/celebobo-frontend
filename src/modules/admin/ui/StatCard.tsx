"use client";

import { ArrowDown, ArrowUp } from "iconsax-reactjs";
import type { ReactNode } from "react";
import { CountUp } from "@/shared/animations/CountUp";
import { Reveal } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";

interface Props {
  label: string;
  value: number;
  /** Formatage du nombre animé (ex: formatPrice). */
  format?: (n: number) => string;
  icon: ReactNode;
  tone?: "green" | "red" | "orange" | "blue" | "dark";
  /** Variation en % vs période précédente (positif = hausse). */
  delta?: number | null;
  deltaLabel?: string;
  delay?: number;
  className?: string;
}

const TONE = {
  green: "bg-primary-100 text-primary-dark",
  red: "bg-danger-100 text-danger",
  orange: "bg-star/15 text-[#b87400]",
  blue: "bg-info/10 text-info",
  dark: "bg-ink-dark/10 text-ink-dark",
};

/** Carte KPI du back-office : icône ronde, valeur animée, variation. */
export function StatCard({ label, value, format, icon, tone = "green", delta, deltaLabel = "vs période précédente", delay = 0, className }: Props) {
  const up = (delta ?? 0) >= 0;
  return (
    <Reveal delay={delay} className={cn("group rounded-box bg-white p-5 transition-transform duration-300 hover:-translate-y-1", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] leading-[19.5px] text-ink-2">{label}</p>
          <p className="mt-2 truncate text-[26px] font-bold leading-[32px]">
            <CountUp to={value} format={format} />
          </p>
        </div>
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-full transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110", TONE[tone])}>{icon}</span>
      </div>
      {delta != null && (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] leading-[18px]">
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold", up ? "bg-primary-100 text-primary-dark" : "bg-danger-100 text-danger")}>
            {up ? <ArrowUp size={11} variant="Bold" /> : <ArrowDown size={11} variant="Bold" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-ink-3">{deltaLabel}</span>
        </p>
      )}
    </Reveal>
  );
}
