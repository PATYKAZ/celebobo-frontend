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

/**
 * Carte KPI du back-office : icône ronde, valeur animée, variation.
 * Mobile : compacte (placée en grille 2 colonnes par les pages : `grid grid-cols-2 gap-3 lg:grid-cols-3`),
 * libellé de comparaison masqué < sm pour ne pas déborder.
 */
export function StatCard({ label, value, format, icon, tone = "green", delta, deltaLabel = "vs période précédente", delay = 0, className }: Props) {
  const up = (delta ?? 0) >= 0;
  return (
    <Reveal delay={delay} className={cn("group relative min-w-0 rounded-box bg-white p-3.5 transition-transform duration-300 sm:p-5 sm:hover:-translate-y-1", className)}>
      {/* mobile : l'icône flotte en haut à droite → le montant dispose de toute la largeur de la carte */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 min-h-[32px] pr-10 text-[12px] leading-[16px] text-ink-2 sm:min-h-0 sm:pr-0 sm:text-[13px] sm:leading-[19.5px]">{label}</p>
          <p className="mt-1 whitespace-nowrap text-[clamp(17px,5.4vw,22px)] font-bold leading-[26px] sm:mt-2 sm:truncate sm:text-[26px] sm:leading-[32px]">
            <CountUp to={value} format={format} />
          </p>
        </div>
        <span className={cn("absolute right-3 top-3 grid size-9 shrink-0 place-items-center rounded-full transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 sm:static sm:size-11 [&_svg]:size-[18px] sm:[&_svg]:size-5", TONE[tone])}>{icon}</span>
      </div>
      {delta != null && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] leading-[18px] sm:mt-3">
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold", up ? "bg-primary-100 text-primary-dark" : "bg-danger-100 text-danger")}>
            {up ? <ArrowUp size={11} variant="Bold" /> : <ArrowDown size={11} variant="Bold" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="hidden text-ink-3 sm:inline">{deltaLabel}</span>
        </p>
      )}
    </Reveal>
  );
}
