"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderWorkflow } from "../services/workflow.service";
import type { OrderStatus } from "../types";

/** Invalide tout le cache liste/détail commandes (client, revendeur, admin) après une transition. */
function useInvalidateOrders() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useSetOrderStatus() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ orderId, to, note, deliveryCode, reason }: { orderId: number; to: OrderStatus; note?: string; deliveryCode?: string; reason?: string }) =>
      orderWorkflow.setStatus(orderId, to, { note, deliveryCode, reason }),
    onSuccess: invalidate,
  });
}

export function useAssignOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ orderId, resellerId, note }: { orderId: number; resellerId: number; note?: string }) => orderWorkflow.assign(orderId, resellerId, { note }),
    onSuccess: invalidate,
  });
}
