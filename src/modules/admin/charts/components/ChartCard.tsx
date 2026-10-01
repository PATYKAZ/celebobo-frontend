"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";
import { Tabs } from "@/shared/ui/Tabs";

interface Props<P extends string> {
  title: string;
  subtitle?: string;
  /** Sélecteur de période (onglets pill) */
  periods?: { value: P; label: string }[];
  period?: P;
  onPeriodChange?: (p: P) => void;
  /** Légende / actions à droite du titre */
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Bloc blanc de graphique : titre, période, légende. */
export function ChartCard<P extends string = string>({ title, subtitle, periods, period, onPeriodChange, legend, children, className, delay = 0 }: Props<P>) {
  return (
    <Reveal delay={delay} className={cn("rounded-box bg-white p-5 sm:p-[26px]", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold leading-[21.6px]">{title}</h2>
          {subtitle && <p className="mt-1 text-[13px] leading-[19.5px] text-ink-3">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {legend}
          {periods && period && onPeriodChange && <Tabs variant="pill" tabs={periods} value={period} onChange={onPeriodChange} />}
        </div>
      </div>
      {children}
    </Reveal>
  );
}

/** Pastille de légende. */
export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
