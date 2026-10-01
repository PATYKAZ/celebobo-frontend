import type { Order, OrderStatus } from "@/modules/orders/types";
import type { Paginated } from "@/shared/lib/api";

export interface AdminOrderListParams {
  status?: OrderStatus | "all";
  page?: number;
  pageSize?: number;
  search?: string;
}

export type AdminOrderPage = Paginated<Order> & { counts?: Record<OrderStatus | "all", number> };

export interface Reseller {
  id: number;
  name: string;
}
