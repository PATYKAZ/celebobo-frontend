import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { PointBalance, PointTransaction } from "../types";

interface BalanceDto {
  eligible: boolean;
  available: string;
  pending: string;
  nextExpiry: string | null;
}

interface TransactionDto {
  id: number;
  points: number;
  reason: string;
  rule_id: number | null;
  rule_name: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

const { points } = ENDPOINTS;

export const pointsService = {
  async balance(): Promise<PointBalance> {
    const dto = await api.get<BalanceDto>(points.me);
    return { total: Number(dto.available) + Number(dto.pending), available: Number(dto.available), pending: Number(dto.pending) };
  },
  async transactions(): Promise<PointTransaction[]> {
    const dtos = await api.get<TransactionDto[]>(points.transactions);
    return dtos.map((d) => ({
      id: d.id,
      points: d.points,
      reason: d.reason,
      ruleId: d.rule_id,
      ruleName: d.rule_name,
      referenceType: d.reference_type,
      referenceId: d.reference_id,
      createdAt: d.created_at,
    }));
  },
};
