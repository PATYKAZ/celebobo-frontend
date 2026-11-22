import { money } from "@/modules/products/services/products.mapper";
import type { ResellerDto } from "../../resellers/services/resellers.mapper";
import type { CommissionPayment, CommissionRow, CommissionTotals, PayoutStatement, PayoutStatementDetail, StatementLineKind, StatementStatus } from "../types";

/** Commissions d'un revendeur (cumuls et mois en cours, après camelCase). */
export interface CommissionSummaryDto {
  reseller: { id: number; name: string };
  earnedThisMonth: string;
  earnedTotal: string;
  paidTotal: string;
  due: string;
  pending: string;
  validated: string;
  deliveryFees: string;
  nextPayoutDate: string;
  payoutThreshold: string;
}

export interface PayoutDto {
  id: number;
  reseller: { id: number; name: string };
  amount: string;
  note: string;
  paidAt: string;
  paidBy: { id: number; name: string } | null;
  statementId: number | null;
  payoutDate: string | null;
}

export interface StatementDto {
  id: number;
  reseller: { id: number; name: string };
  payoutDate: string;
  status: StatementStatus;
  commissions: string;
  deliveryFees: string;
  total: string;
  preparedAt: string;
  paidAt: string | null;
  payoutId: number | null;
}

export interface StatementDetailDto extends StatementDto {
  lines: { kind: StatementLineKind; title: string; saleId: number | null; orderNumber: string | null; baseAmount: string | null; amount: string; at: string }[];
}

export const toStatement = (dto: StatementDto): PayoutStatement => ({
  id: dto.id,
  resellerId: dto.reseller.id,
  resellerName: dto.reseller.name,
  payoutDate: dto.payoutDate,
  status: dto.status,
  commissions: money(dto.commissions),
  deliveryFees: money(dto.deliveryFees),
  total: money(dto.total),
  preparedAt: dto.preparedAt,
  paidAt: dto.paidAt,
});

export const toStatementDetail = (dto: StatementDetailDto): PayoutStatementDetail => ({
  ...toStatement(dto),
  lines: dto.lines.map((l) => ({
    kind: l.kind,
    title: l.title,
    saleId: l.saleId,
    orderNumber: l.orderNumber,
    baseAmount: l.baseAmount == null ? null : money(l.baseAmount),
    amount: money(l.amount),
    at: l.at,
  })),
});

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
  statementId: dto.statementId ?? null,
  payoutDate: dto.payoutDate ?? null,
});

/** Ligne de commission enrichie par la fiche revendeur (statut, disponibilité, ventes) et le dernier paiement. */
export function toCommissionRow(dto: CommissionSummaryDto, reseller?: ResellerDto, lastPaymentAt: string | null = null): CommissionRow {
  return {
    resellerId: dto.reseller.id,
    name: dto.reseller.name,
    avatar: reseller?.avatar || null,
    availability: reseller?.availability ?? "offline",
    active: reseller?.isActive ?? true,
    salesCount: reseller?.performance.salesCount ?? 0,
    earned: money(dto.earnedTotal),
    earnedMonth: money(dto.earnedThisMonth),
    pending: money(dto.pending),
    validated: money(dto.validated),
    deliveryFees: money(dto.deliveryFees),
    paid: money(dto.paidTotal),
    due: money(dto.due),
    nextPayoutDate: dto.nextPayoutDate,
    threshold: money(dto.payoutThreshold),
    lastPaymentAt,
  };
}

export const sumRows = (rows: CommissionRow[]): CommissionTotals => ({
  earned: rows.reduce((n, r) => n + r.earned, 0),
  earnedMonth: rows.reduce((n, r) => n + r.earnedMonth, 0),
  pending: rows.reduce((n, r) => n + r.pending, 0),
  validated: rows.reduce((n, r) => n + r.validated, 0),
  deliveryFees: rows.reduce((n, r) => n + r.deliveryFees, 0),
  paid: rows.reduce((n, r) => n + r.paid, 0),
  due: rows.reduce((n, r) => n + r.due, 0),
});
