import type { Order, OrderStatusEvent } from "@/modules/orders/types";

/** Vue publique d'une commande (sans données personnelles : ni acteurs, ni adresse). */
export type TrackedOrder = Pick<Order, "createdAt" | "status" | "totalPrice"> & {
  number: string;
  statusHistory: OrderStatusEvent[];
  items: { name: string; quantity: number; variantLabel?: string | null }[];
};

export interface TrackingQuery {
  /** Numéro de commande (ex: CB-7KQ2-M9XA) */
  number: string;
  /** E-mail OU téléphone utilisé à la commande */
  contact: string;
}
