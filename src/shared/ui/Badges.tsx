import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";

/** Badge « Remise $199.00 » (fond teal, petit rayon). */
export function SaveBadge({ amount, className, large }: { amount: number; className?: string; large?: boolean }) {
  // prix affichés dans la devise choisie par le visiteur (USD ou FC)
  const formatPrice = useFormatPrice();
  return (
    <div
      className={cn(
        "inline-flex flex-col rounded-box bg-primary text-white",
        large ? "rounded-box px-4 py-1.5" : "px-3 py-1.5",
        className,
      )}
    >
      <span className="text-xs">Remise</span>
      <span className={cn("font-medium", large ? "text-lg" : "text-sm")}>{formatPrice(amount)}</span>
    </div>
  );
}

export function NewBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-sm bg-ink-dark px-2 text-xs font-medium text-white", className)}>
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

/** Pastille « Livraison offerte », « Cadeau »… (fond teinté + texte plein, casse de phrase). */
export function Pill({ tone = "green", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-sm px-2 text-xs font-medium", TONES[tone], className)}>
      {children}
    </span>
  );
}

/** Pastille de statut (admin / commandes). */
export function StatusDot({ tone, children }: { tone: "green" | "orange" | "red" | "gray" | "blue"; children: ReactNode }) {
  const map = {
    green: "bg-primary-100 text-primary-dark",
    orange: "bg-star/15 text-warn",
    red: "bg-danger-100 text-danger",
    gray: "bg-chip text-ink-2",
    blue: "bg-info/10 text-info",
  } as const;
  const dot = { green: "bg-primary", orange: "bg-star", red: "bg-danger", gray: "bg-ink-3", blue: "bg-info" } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium", map[tone])}>
      <span className={cn("size-1.5 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}
