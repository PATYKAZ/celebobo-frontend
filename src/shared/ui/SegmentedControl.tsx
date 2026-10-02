"use client";

import { motion } from "motion/react";
import { useId, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  /** compteur optionnel */
  count?: number;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  /** occupe toute la largeur, options de largeur égale (mobile) */
  fullWidth?: boolean;
  size?: "sm" | "md";
  "aria-label"?: string;
}

/** Contrôle segmenté (2–4 choix : période 7j/30j/12m, grille/liste, vue…). La pastille glisse entre les options. */
export function SegmentedControl<T extends string>({ options, value, onChange, className, fullWidth, size = "md", ...rest }: Props<T>) {
  const id = useId();
  return (
    <div role="tablist" aria-label={rest["aria-label"]} className={cn("inline-flex gap-0.5 rounded-full bg-chip p-1", fullWidth && "flex w-full", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn("relative flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors", size === "md" ? "min-h-10 px-4 text-[13px]" : "min-h-8 px-3 text-[12px]", fullWidth && "flex-1", active ? "text-white" : "text-ink-2 hover:text-ink")}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{o.label}</span>
            {o.count != null && <span className={cn("relative text-[11px] opacity-70")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
