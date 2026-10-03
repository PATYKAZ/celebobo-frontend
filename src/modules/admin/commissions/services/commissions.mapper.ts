import { money } from "@/modules/products/services/products.mapper";
import type { ResellerDto } from "../../resellers/services/resellers.mapper";
import type { CommissionPayment, CommissionRow, CommissionTotals } from "../types";

/** Commissions d'un revendeur (cumuls et mois en cours, après camelCase). */
export interface CommissionSummaryDto {
  reseller: { id: number; name: string };
  rate: string;
  earnedThisMonth: string;
  earnedTotal: string;
  paidTotal: string;
  due: string;
}

export interface PayoutDto {
  id: number;
  reseller: { id: number; name: string };
  amount: string;
  note: string;
  paidAt: string;
  paidBy: { id: number; name: string } | null;
}

export interface MonthlyCommissionDto {
  month: string;
  earned: string;
  paid: string;
}

export const toPayment = (dto: PayoutDto): CommissionPayment => ({
  id: dto.id,
  resellerId: dto.reseller.id,
  resellerName: dto.reseller.name,
  amount: money(dto.amount),
  paidAt: dto.paidAt,
  note: dto.note || null,
  paidByName: dto.paidBy?.name ?? "—",
});

/** Ligne de commission enrichie par la fiche revendeur (statut, disponibilité, ventes) et le dernier paiement. */
export function toCommissionRow(dto: CommissionSummaryDto, reseller?: ResellerDto, lastPaymentAt: string | null = null): CommissionRow {
  return {
    resellerId: dto.reseller.id,
    name: dto.reseller.name,
    avatar: reseller?.avatar || null,
    availability: reseller?.availability ?? "offline",
    active: reseller?.isActive ?? true,
    rate: Number(dto.rate),
    salesCount: reseller?.performance.salesCount ?? 0,
    earned: money(dto.earnedTotal),
    earnedMonth: money(dto.earnedThisMonth),
    paid: money(dto.paidTotal),
    due: money(dto.due),
    lastPaymentAt,
  };
}

export const sumRows = (rows: CommissionRow[]): CommissionTotals => ({
  earned: rows.reduce((n, r) => n + r.earned, 0),
  earnedMonth: rows.reduce((n, r) => n + r.earnedMonth, 0),
  paid: rows.reduce((n, r) => n + r.paid, 0),
  due: rows.reduce((n, r) => n + r.due, 0),
});
