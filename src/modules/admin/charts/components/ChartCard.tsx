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

/** Bloc blanc de graphique : titre, période, légende. Mobile : titre puis légende (wrap) puis période pleine largeur. */
export function ChartCard<P extends string = string>({ title, subtitle, periods, period, onPeriodChange, legend, children, className, delay = 0 }: Props<P>) {
  return (
    <Reveal delay={delay} className={cn("min-w-0 rounded-box bg-white p-4 sm:p-[26px]", className)}>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold leading-[21.6px] sm:text-[18px]">{title}</h2>
          {subtitle && <p className="mt-1 text-[12px] leading-[18px] text-ink-3 sm:text-[13px] sm:leading-[19.5px]">{subtitle}</p>}
        </div>
        <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {legend && <div className="flex flex-wrap items-center gap-x-3 gap-y-1">{legend}</div>}
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
