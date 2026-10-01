"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@/modules/orders/types";
import { adminOrdersService } from "../services/admin-orders.service";
import type { AdminOrderListParams } from "../types";

export const adminOrderKeys = {
  all: ["admin", "orders"] as const,
  list: (p: AdminOrderListParams) => ["admin", "orders", "list", p] as const,
  resellers: ["admin", "orders", "resellers"] as const,
};

export function useAdminOrders(params: AdminOrderListParams) {
  return useQuery({ queryKey: adminOrderKeys.list(params), queryFn: () => adminOrdersService.list(params), placeholderData: keepPreviousData });
}

export function useResellerOptions() {
  return useQuery({ queryKey: adminOrderKeys.resellers, queryFn: adminOrdersService.resellers, staleTime: 5 * 60_000 });
}

export function useAssignOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, revendeurId }: { orderId: number; revendeurId: number }) => adminOrdersService.assign(orderId, revendeurId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminOrderKeys.all });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useConcludeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: Order) => adminOrdersService.conclude(order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminOrderKeys.all });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
