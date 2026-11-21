import { ENDPOINTS } from "@/config/endpoints";
import { api, idempotent, type PageEnvelope } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { money } from "@/modules/products/services/products.mapper";
import { monthLabel } from "../../dashboard/lib/period";
import type { ResellerDto } from "../../resellers/services/resellers.mapper";
import type { CommissionPayment, CommissionsOverview, PayoutStatement, PayoutStatementDetail, PayStatementInput, StatementStatus } from "../types";
import {
  sumRows,
  toCommissionRow,
  toPayment,
  toStatement,
  toStatementDetail,
  type CommissionSummaryDto,
  type MonthlyCommissionDto,
  type PayoutDto,
  type StatementDetailDto,
  type StatementDto,
} from "./commissions.mapper";

const { commissions, payouts, payoutStatements, resellers } = ENDPOINTS.admin;

const headings = () => ({
  asOfLabel: `Cumul au ${formatDate(new Date())}`,
  monthLabel: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
});

const payoutsOf = (resellerId?: number) => api.get<PageEnvelope<PayoutDto>>(payouts, { params: { resellerId, pageSize: 100 } });
const statementsOf = (params: { resellerId?: number; status?: StatementStatus }) =>
  api.get<PageEnvelope<StatementDto>>(payoutStatements.list, { params: { ...params, pageSize: 100 } });

export const commissionsService = {
  /** Tous les revendeurs (`all`, responsable/admin) ou uniquement soi-même (`own`, revendeur). */
  async overview(scope: "all" | "own"): Promise<CommissionsOverview> {
    if (scope === "all") {
      const [summaries, list, paid] = await Promise.all([
        api.get<CommissionSummaryDto[]>(commissions.overview),
        api.get<PageEnvelope<ResellerDto>>(resellers.list, { params: { pageSize: 100 } }),
        payoutsOf(),
      ]);
      const byId = new Map(list.results.map((r) => [r.id, r]));
      const last = new Map<number, string>();
      for (const p of paid.results) if (!last.has(p.reseller.id)) last.set(p.reseller.id, p.paidAt);
      const rows = summaries.map((s) => toCommissionRow(s, byId.get(s.reseller.id), last.get(s.reseller.id) ?? null)).sort((a, b) => b.due - a.due);
      return { scope, ...headings(), rows, totals: sumRows(rows) };
    }
    const [summary, series, paid, statements] = await Promise.all([
      api.get<CommissionSummaryDto>(commissions.summary),
      api.get<MonthlyCommissionDto[]>(commissions.series),
      payoutsOf(),
      statementsOf({}),
    ]);
    const payments = paid.results.map(toPayment);
    const row = toCommissionRow(summary, undefined, payments[0]?.paidAt ?? null);
    const recent = series.slice(-6);
    return {
      scope,
      ...headings(),
      rows: [row],
      totals: sumRows([row]),
      monthly: { labels: recent.map((m) => monthLabel(new Date(m.month))), values: recent.map((m) => money(m.earned)) },
      payments,
      statements: statements.results.filter((s) => s.status !== "cancelled").map(toStatement),
    };
  },

  /** Historique des paiements d'un revendeur. */
  async payments(resellerId: number): Promise<CommissionPayment[]> {
    return (await payoutsOf(resellerId)).results.map(toPayment);
  },

  /** Relevés de paiement : d'un revendeur, ou de tous (responsable/admin), filtrables par statut. */
  async statements(params: { resellerId?: number; status?: StatementStatus } = {}): Promise<PayoutStatement[]> {
    return (await statementsOf(params)).results.map(toStatement);
  },

  async statement(id: number): Promise<PayoutStatementDetail> {
    return toStatementDetail(await api.get<StatementDetailDto>(payoutStatements.detail(id)));
  },

  /** Marque un relevé préparé comme payé (admin) : le paiement est le total du relevé. */
  async pay(input: PayStatementInput): Promise<CommissionPayment> {
    return toPayment(await api.post<PayoutDto>(payouts, { statementId: input.statementId, note: input.note ?? "" }, idempotent()));
  },
};
