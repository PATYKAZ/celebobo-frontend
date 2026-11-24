import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import { StatusDot } from "@/shared/ui/Badges";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, type Order, type OrderStatus } from "@/modules/orders/types";
import type { ResellerAvailability as Availability } from "@/modules/auth/types";

export function OrderStatusDot({ status }: { status: OrderStatus }) {
  return <StatusDot tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</StatusDot>;
}

/** Commande payée puis annulée : remboursement à faire, ou fait. */
export function RefundBadge({ status }: { status?: Order["refundStatus"] }) {
  if (!status) return null;
  return status === "due" ? (
    <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-bold text-danger">À rembourser</span>
  ) : (
    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-dark">Remboursée</span>
  );
}

const AV = {
  online: { cls: "bg-primary", label: "En ligne" },
  away: { cls: "bg-star", label: "Absent" },
  offline: { cls: "bg-ink-3", label: "Hors ligne" },
} as const;

export const availabilityLabel = (a: Availability) => AV[a].label;

/** Pastille de disponibilité d'un revendeur. */
export function AvailabilityDot({ value, withLabel, className }: { value: Availability; withLabel?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={AV[value].label}>
      <span className={cn("relative size-2.5 rounded-full", AV[value].cls)}>
        {value === "online" && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/60" />}
      </span>
      {withLabel && <span className="text-xs text-ink-2">{AV[value].label}</span>}
    </span>
  );
}

/** Pile de miniatures des articles d'une commande. */
export function Thumbs({ order }: { order: Order }) {
  // listes : l'API ne détaille pas les lignes, seulement la vignette du 1er article et le nombre d'articles
  if (!order.items.length) {
    if (!order.previewImage && !order.itemsCount) return <span className="text-ink-3">—</span>;
    return (
      <span className="flex items-center gap-2">
        <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-page">
          {order.previewImage && <Image src={order.previewImage} alt={order.previewName ?? ""} fill sizes="36px" className="object-cover" />}
        </span>
        {(order.itemsCount ?? 0) > 1 && <span className="text-xs font-semibold text-ink-2">+{(order.itemsCount ?? 0) - 1}</span>}
      </span>
    );
  }
  const extra = order.items.length - 3;
  return (
    <div className="flex items-center">
      {order.items.slice(0, 3).map((it, i) => (
        <span key={it.id} className="relative -ml-2 size-9 overflow-hidden rounded-full bg-page ring-2 ring-surface first:ml-0" style={{ zIndex: 3 - i }}>
          {it.productImage && <Image src={it.productImage} alt={it.productName} fill sizes="36px" className="object-cover" />}
        </span>
      ))}
      {extra > 0 && <span className="-ml-2 grid size-9 place-items-center rounded-full bg-chip text-xs font-bold ring-2 ring-surface">+{extra}</span>}
    </div>
  );
}

export const PAYMENT_LABEL = { OrangeMoney: "Orange Money", AirtelMoney: "Airtel Money", "M-Pesa": "M-Pesa", Cash: "Cash" } as const;
