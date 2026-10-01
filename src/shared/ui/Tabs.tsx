"use client";

import { motion } from "motion/react";
import { useId } from "react";
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

export function Tabs<T extends string>({ tabs, value, onChange, variant = "title", className }: Props<T>) {
  const id = useId();
  if (variant === "pill") {
    return (
      <div role="tablist" className={cn("inline-flex gap-1 rounded-full bg-chip p-1", className)}>
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={t.value === value}
            onClick={() => onChange(t.value)}
            className={cn("relative rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors", t.value === value ? "text-white" : "text-ink-2 hover:text-ink")}
          >
            {t.value === value && <motion.span layoutId={`pill-${id}`} className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <span className="relative">
              {t.label}
              {t.count != null && <span className="ml-1.5 opacity-70">{t.count}</span>}
            </span>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div role="tablist" className={cn("flex flex-wrap items-center gap-x-10 gap-y-2", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          className={cn("relative pb-1 text-tab uppercase transition-all", t.value === value ? "font-semibold" : "opacity-60 hover:opacity-100")}
        >
          {t.label}
          {t.value === value && <motion.span layoutId={`tab-${id}`} className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
        </button>
      ))}
    </div>
  );
}
