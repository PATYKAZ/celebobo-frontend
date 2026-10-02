"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/shared/hooks/useRealtime";
import { channels, type UserEvent } from "@/shared/lib/realtime";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { adminOrdersService } from "../services/admin-orders.service";
import type { AdminOrderListParams } from "../types";

export const adminOrderKeys = {
  all: ["admin", "orders"] as const,
  list: (p: AdminOrderListParams) => ["admin", "orders", "list", p] as const,
  detail: (id: number) => ["admin", "orders", "detail", id] as const,
  resellers: ["admin", "orders", "resellers"] as const,
};

export function useAdminOrders(params: AdminOrderListParams) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  // Rafraîchit la liste quand une commande change / m'est assignée (temps réel).
  useRealtime<UserEvent>(userId ? channels.user(userId) : null, () => qc.invalidateQueries({ queryKey: adminOrderKeys.all }));
  return useQuery({ queryKey: adminOrderKeys.list(params), queryFn: () => adminOrdersService.list(params), placeholderData: keepPreviousData });
}

export function useAdminOrder(id: number | undefined) {
  return useQuery({ queryKey: adminOrderKeys.detail(id ?? 0), queryFn: () => adminOrdersService.detail(id as number), enabled: !!id, retry: false });
}

/** Tous les revendeurs (actifs + inactifs) avec disponibilité et charge — pour l'assignation. */
export function useResellerOptions(enabled = true) {
  return useQuery({ queryKey: adminOrderKeys.resellers, queryFn: adminOrdersService.resellers, enabled, staleTime: 15_000 });
}
