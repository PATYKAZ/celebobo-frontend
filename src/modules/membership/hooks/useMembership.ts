"use client";

import { useQuery } from "@tanstack/react-query";
import { pointsService } from "../services/membership.service";
import type { PointBalance, PointTransaction } from "../types";

export const pointsKeys = { balance: ["points", "balance"] as const, transactions: ["points", "transactions"] as const };

/** Solde de points du client connecté. */
export function useMyPoints(enabled = true) {
  return useQuery({ queryKey: pointsKeys.balance, queryFn: pointsService.balance, enabled });
}

/** Historique des transactions de points du client. */
export function useMyPointTransactions(enabled = true) {
  return useQuery({ queryKey: pointsKeys.transactions, queryFn: pointsService.transactions, enabled });
}
