"use client";

import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { money } from "@/modules/products/services/products.mapper";

/** Cagnotte du client : utilisable, en attente (délai de retour), prochaine expiration ; `eligible` faux = rien à afficher. */
export interface CashbackBalance {
  eligible: boolean;
  available: number;
  pending: number;
  nextExpiry: string | null;
}

interface BalanceDto {
  eligible: boolean;
  available: string;
  pending: string;
  nextExpiry: string | null;
}

export function useCashbackBalance(enabled = true) {
  return useQuery({
    queryKey: ["cashback", "mine"] as const,
    queryFn: async (): Promise<CashbackBalance> => {
      const dto = await api.get<BalanceDto>(ENDPOINTS.membership.cashback);
      return { eligible: dto.eligible, available: money(dto.available), pending: money(dto.pending), nextExpiry: dto.nextExpiry };
    },
    enabled,
  });
}
