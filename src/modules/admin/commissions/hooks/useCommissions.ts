"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { can } from "@/modules/auth/permissions";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { commissionsService } from "../services/commissions.service";
import type { PayStatementInput, StatementStatus } from "../types";

export const commissionKeys = {
  overview: (role: string | undefined) => ["admin", "commissions", "overview", role] as const,
  payments: (id: number | null) => ["admin", "commissions", "payments", id] as const,
  statements: (resellerId: number | null, status?: StatementStatus) => ["admin", "commissions", "statements", resellerId, status] as const,
  statement: (id: number | null) => ["admin", "commissions", "statement", id] as const,
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

/** Relevés de paiement d'un revendeur (`resellerId`) ou de tous (`null`, responsable/admin). */
export function useStatements(resellerId: number | null, status?: StatementStatus, enabled = true) {
  return useQuery({
    queryKey: commissionKeys.statements(resellerId, status),
    queryFn: () => commissionsService.statements({ resellerId: resellerId ?? undefined, status }),
    enabled,
  });
}

export function useStatement(id: number | null) {
  return useQuery({
    queryKey: commissionKeys.statement(id),
    queryFn: () => commissionsService.statement(id as number),
    enabled: id != null,
  });
}

export function usePayStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayStatementInput) => commissionsService.pay(input),
    onSuccess: () => qc.invalidateQueries(),
  });
}
