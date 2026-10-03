import { money } from "@/modules/products/services/products.mapper";
import { toStatus, type ApiOrderStatus } from "@/modules/orders/services/orders.mapper";
import type { TrackedOrder } from "../types";

export interface TrackingDto {
  number: string;
  status: ApiOrderStatus;
  createdAt: string;
  total: string;
  items: { name: string; variantLabel: string; quantity: number }[];
  history: { status: ApiOrderStatus; at: string }[];
}

export function toTrackedOrder(dto: TrackingDto): TrackedOrder {
  return {
    number: dto.number,
    status: toStatus(dto.status),
    createdAt: dto.createdAt,
    totalPrice: money(dto.total),
    statusHistory: dto.history.map((h) => ({ status: toStatus(h.status), at: h.at, by: { id: 0, name: "", role: "system" } })),
    items: dto.items.map((i) => ({ name: i.name, quantity: i.quantity, variantLabel: i.variantLabel || null })),
  };
}
