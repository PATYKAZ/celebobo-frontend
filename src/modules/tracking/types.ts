import type { Order, OrderStatusEvent } from "@/modules/orders/types";

/** Vue publique d'une commande (sans données personnelles : noms du personnel masqués, pas d'adresse). */
export type TrackedOrder = Pick<Order, "id" | "createdAt" | "status" | "totalPrice"> & {
  statusHistory: OrderStatusEvent[];
  items: { name: string; quantity: number; variantLabel?: string | null }[];
};

export interface TrackingQuery {
  /** Numéro de commande (ex: 42 ou #42) */
  number: string;
  /** E-mail OU téléphone utilisé à la commande */
  contact: string;
}
