import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import { StatusDot } from "@/shared/ui/Badges";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, type Order, type OrderStatus } from "@/modules/orders/types";
import type { ResellerAvailability as Availability } from "@/modules/auth/types";

export function OrderStatusDot({ status }: { status: OrderStatus }) {
  return <StatusDot tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</StatusDot>;
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
      {withLabel && <span className="text-[12px] text-ink-2">{AV[value].label}</span>}
    </span>
  );
}

/** Pile de miniatures des articles d'une commande. */
export function Thumbs({ order }: { order: Order }) {
  const extra = order.items.length - 3;
  return (
    <div className="flex items-center">
      {order.items.slice(0, 3).map((it, i) => (
        <span key={it.id} className="relative -ml-2 size-9 overflow-hidden rounded-full bg-page ring-2 ring-white first:ml-0" style={{ zIndex: 3 - i }}>
          {it.productImage && <Image src={it.productImage} alt={it.productName} fill sizes="36px" className="object-cover" />}
        </span>
      ))}
      {extra > 0 && <span className="-ml-2 grid size-9 place-items-center rounded-full bg-chip text-[11px] font-bold ring-2 ring-white">+{extra}</span>}
    </div>
  );
}

export const PAYMENT_LABEL = { OrangeMoney: "Orange Money", AirtelMoney: "Airtel Money", "M-Pesa": "M-Pesa", Cash: "Cash" } as const;
