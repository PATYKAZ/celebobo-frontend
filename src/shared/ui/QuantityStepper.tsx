"use client";

import { Add, Minus } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = "md", className }: Props) {
  const h = size === "sm" ? "h-8" : "h-[45px]";
  const btn = cn("grid place-items-center text-ink transition-colors hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink", size === "sm" ? "w-8" : "w-11");
  return (
    <div className={cn("inline-flex items-center overflow-hidden rounded-box border border-line bg-white", h, className)}>
      <button type="button" aria-label="Diminuer" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus size={16} />
      </button>
      <span aria-live="polite" className={cn("min-w-9 text-center font-semibold tabular-nums", size === "sm" ? "text-[13px]" : "text-[14px]")}>
        {value}
      </span>
      <button type="button" aria-label="Augmenter" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Add size={16} />
      </button>
    </div>
  );
}
