import { Clock, Danger } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { Pill } from "@/shared/ui/Badges";
import type { Product } from "@/modules/products/types";
import { deadlineState, stockState } from "../types";

/** Pastille de stock : OK / stock bas (≤ seuil) / rupture, avec la quantité. */
export function StockPill({ product, className }: { product: Pick<Product, "stock" | "stockThreshold">; className?: string }) {
  const s = stockState(product);
  if (s === "out") return <Pill tone="red" className={className}>Rupture</Pill>;
  if (s === "low") return <Pill tone="yellow" className={cn("!text-[#9a6a00]", className)}>Bas · {product.stock}</Pill>;
  return <Pill tone="green" className={className}>{product.stock} en stock</Pill>;
}

/** Badge « à vendre avant le … » : proche (≤ 14 j) ou dépassé. Rien si pas de date ou échéance lointaine. */
export function DeadlineBadge({ dateWish, full }: { dateWish: string | null | undefined; full?: boolean }) {
  const { state, days } = deadlineState(dateWish);
  if (state === "none") return null;
  if (state === "ok") return full ? <span className="inline-flex items-center gap-1 text-[12px] text-ink-3"><Clock size={13} /> avant le {formatDate(dateWish as string)}</span> : null;
  const overdue = state === "overdue";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold", overdue ? "bg-danger-100 text-danger" : "bg-star/15 text-[#b87400]")}>
      {overdue ? <Danger size={12} variant="Bold" /> : <Clock size={12} variant="Bold" />}
      {overdue ? `Dépassé de ${Math.abs(days)} j` : days === 0 ? "Aujourd'hui" : `J-${days}`}
    </span>
  );
}
