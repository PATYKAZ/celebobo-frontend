"use client";

import { motion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/shared/lib/cn";

interface Tab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (v: T) => void;
  /** "title" : onglets du design (18px upper, actif 600 / inactif 400 opacity .6). "pill" : segmenté (admin). */
  variant?: "title" | "pill";
  className?: string;
}

/**
 * Onglets. Sur mobile : rangée défilante (snap) avec fondu aux bords, l'onglet actif est
 * automatiquement recentré. Sur desktop : rendu inchangé.
 */
export function Tabs<T extends string>({ tabs, value, onChange, variant = "title", className }: Props<T>) {
  const id = useId();
  const row = useRef<HTMLDivElement>(null);

  // recentre l'onglet actif dans la rangée défilante
  useEffect(() => {
    const el = row.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [value]);

  // fondu à droite uniquement (indique qu'on peut défiler) : un fondu à gauche rognerait le 1er onglet au repos
  const fade = "[mask-image:linear-gradient(90deg,#000_calc(100%-28px),transparent)] sm:[mask-image:none]";

  if (variant === "pill") {
    return (
      <div className={cn("-mx-1 max-w-full overflow-hidden", className)}>
        <div ref={row} role="tablist" className={cn("no-scrollbar flex snap-x snap-mandatory gap-1 overflow-x-auto px-1 py-0.5 sm:inline-flex sm:rounded-full sm:bg-chip sm:p-1", fade)}>
          {tabs.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={t.value === value}
              onClick={() => onChange(t.value)}
              className={cn(
                "relative shrink-0 snap-center whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors sm:py-1.5",
                t.value === value ? "text-white" : "bg-chip text-ink-2 hover:text-ink sm:bg-transparent",
              )}
            >
              {t.value === value && <motion.span layoutId={`pill-${id}`} className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">
                {t.label}
                {t.count != null && <span className="ml-1.5 opacity-70">{t.count}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("max-w-full overflow-hidden", className)}>
      <div ref={row} role="tablist" className={cn("no-scrollbar flex snap-x snap-mandatory items-center gap-x-6 overflow-x-auto sm:flex-wrap sm:gap-x-10 sm:gap-y-2 sm:overflow-visible", fade)}>
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={t.value === value}
            onClick={() => onChange(t.value)}
            className={cn("relative shrink-0 snap-center whitespace-nowrap py-2 text-[15px] uppercase leading-[22px] transition-all sm:py-0 sm:pb-1 sm:text-tab", t.value === value ? "font-semibold" : "opacity-60 hover:opacity-100")}
          >
            {t.label}
            {t.value === value && <motion.span layoutId={`tab-${id}`} className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
