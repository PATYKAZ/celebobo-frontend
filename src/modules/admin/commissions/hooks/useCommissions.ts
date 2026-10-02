"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { commissionsService } from "../services/commissions.service";
import type { PayCommissionInput } from "../types";

export const commissionKeys = {
  overview: (role: string | undefined) => ["admin", "commissions", "overview", role] as const,
  payments: (id: number | null) => ["admin", "commissions", "payments", id] as const,
};

/** Vue d'ensemble : tous les revendeurs (responsable/admin) ou uniquement soi-même (revendeur). */
export function useCommissions() {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({ queryKey: commissionKeys.overview(role), queryFn: commissionsService.overview, enabled: !!role });
}

export function useCommissionPayments(resellerId: number | null) {
  return useQuery({
    queryKey: commissionKeys.payments(resellerId),
    queryFn: () => commissionsService.payments(resellerId as number),
    enabled: resellerId != null,
  });
}

export function usePayCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayCommissionInput) => commissionsService.pay(input),
    onSuccess: () => qc.invalidateQueries(),
  });
}
