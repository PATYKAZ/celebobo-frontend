import { StatusDot } from "@/shared/ui/Badges";
import { ORDER_STATUS_LABEL, type OrderStatus } from "../types";

const TONE = { attente: "orange", traitement: "blue", terminé: "green" } as const;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusDot tone={TONE[status]}>{ORDER_STATUS_LABEL[status]}</StatusDot>;
}
