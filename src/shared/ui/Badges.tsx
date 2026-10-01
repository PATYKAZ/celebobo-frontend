import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";

/** Badge « REMISE $199.00 » (dis-card du design : vert, rad 7). */
export function SaveBadge({ amount, className, large }: { amount: number; className?: string; large?: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex flex-col rounded-[7px] bg-primary text-white",
        large ? "rounded-box px-[15px] py-[5px]" : "px-[10px] py-[5px]",
        className,
      )}
    >
      <span className={cn("uppercase", large ? "text-[12px] leading-[18px]" : "text-[10px] leading-[15px]")}>Remise</span>
      <span className={cn("font-medium", large ? "text-[18px] leading-[21.6px]" : "text-[14px] leading-[16.8px]")}>{formatPrice(amount)}</span>
    </div>
  );
}

export function NewBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block rounded-[5px] bg-ink-dark px-2 py-1 text-[10px] uppercase leading-[15px] text-white", className)}>
      Nouveau
    </span>
  );
}

type Tone = "green" | "red" | "dark" | "yellow" | "gray";
const TONES: Record<Tone, string> = {
  green: "bg-primary-50 text-primary",
  red: "bg-danger-50 text-danger",
  dark: "bg-ink-dark/5 text-ink-dark",
  yellow: "bg-sun/30 text-ink",
  gray: "bg-chip text-ink-2",
};

/** Pastille « LIVRAISON OFFERTE », « CADEAU »… (fond 5 % + texte plein). */
export function Pill({ tone = "green", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-[21px] items-center rounded-md px-[10px] text-[10px] font-medium uppercase leading-[15px]", TONES[tone], className)}>
      {children}
    </span>
  );
}

/** Pastille de statut (admin / commandes). */
export function StatusDot({ tone, children }: { tone: "green" | "orange" | "red" | "gray" | "blue"; children: ReactNode }) {
  const map = {
    green: "bg-primary-100 text-primary-dark",
    orange: "bg-star/15 text-[#b87400]",
    red: "bg-danger-100 text-danger",
    gray: "bg-chip text-ink-2",
    blue: "bg-info/10 text-info",
  } as const;
  const dot = { green: "bg-primary", orange: "bg-star", red: "bg-danger", gray: "bg-ink-3", blue: "bg-info" } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium leading-[18px]", map[tone])}>
      <span className={cn("size-1.5 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}
