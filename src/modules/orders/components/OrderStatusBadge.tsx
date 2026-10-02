import { StatusDot } from "@/shared/ui/Badges";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, type OrderStatus } from "../types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusDot tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</StatusDot>;
}
