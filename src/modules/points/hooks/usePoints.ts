"use client";

import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { money } from "@/modules/products/services/products.mapper";
import type { PointsBalance, PointsMovementKind } from "../types";

interface MovementDto {
  kind: PointsMovementKind;
  amount: string;
  at: string;
  orderNumber: string | null;
  pending: boolean;
}

interface BalanceDto {
  eligible: boolean;
  available: string;
  pending: string;
  nextExpiry: string | null;
  closesAt?: string | null;
  ordersCount: number;
  ordersTotal: string;
  history: MovementDto[];
}

export const pointsKeys = {
  all: ["points"] as const,
  mine: ["points", "mine"] as const,
};

/** Solde, points en attente, validité, factures encaissées et derniers mouvements du client (`GET /me/points/`). */
export function usePointsBalance(enabled = true) {
  return useQuery({
    queryKey: pointsKeys.mine,
    queryFn: async (): Promise<PointsBalance> => {
      const dto = await api.get<BalanceDto>(ENDPOINTS.points.me);
      return {
        eligible: dto.eligible,
        available: money(dto.available),
        pending: money(dto.pending),
        nextExpiry: dto.nextExpiry,
        closesAt: dto.closesAt ?? null,
        ordersCount: dto.ordersCount ?? 0,
        ordersTotal: money(dto.ordersTotal),
        history: (dto.history ?? []).map((m) => ({ kind: m.kind, amount: money(m.amount), at: m.at, orderNumber: m.orderNumber, pending: m.pending })),
      };
    },
    enabled,
  });
}
