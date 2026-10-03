"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { can } from "@/modules/auth/permissions";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { commissionsService } from "../services/commissions.service";
import type { PayCommissionInput } from "../types";

export const commissionKeys = {
  overview: (role: string | undefined) => ["admin", "commissions", "overview", role] as const,
  payments: (id: number | null) => ["admin", "commissions", "payments", id] as const,
};

/** Vue d'ensemble : tous les revendeurs (responsable/admin) ou uniquement soi-même (revendeur). */
export function useCommissions() {
  const user = useAuthStore((s) => s.user);
  const scope = can(user, "commissions.view.all") ? "all" : "own";
  return useQuery({ queryKey: commissionKeys.overview(user ? `${user.id}:${scope}` : undefined), queryFn: () => commissionsService.overview(scope), enabled: !!user });
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
