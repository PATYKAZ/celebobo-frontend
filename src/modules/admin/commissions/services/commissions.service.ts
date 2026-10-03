import { ENDPOINTS } from "@/config/endpoints";
import { api, idempotent, type PageEnvelope } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { money } from "@/modules/products/services/products.mapper";
import { monthLabel } from "../../dashboard/lib/period";
import type { ResellerDto } from "../../resellers/services/resellers.mapper";
import type { CommissionPayment, CommissionsOverview, PayCommissionInput } from "../types";
import { sumRows, toCommissionRow, toPayment, type CommissionSummaryDto, type MonthlyCommissionDto, type PayoutDto } from "./commissions.mapper";

const { commissions, payouts, resellers } = ENDPOINTS.admin;

const headings = () => ({
  asOfLabel: `Cumul au ${formatDate(new Date())}`,
  monthLabel: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
});

const payoutsOf = (resellerId?: number) => api.get<PageEnvelope<PayoutDto>>(payouts, { params: { resellerId, pageSize: 100 } });

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
    const [summary, series, paid] = await Promise.all([
      api.get<CommissionSummaryDto>(commissions.summary),
      api.get<MonthlyCommissionDto[]>(commissions.series),
      payoutsOf(),
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
    };
  },

  /** Historique des paiements d'un revendeur. */
  async payments(resellerId: number): Promise<CommissionPayment[]> {
    return (await payoutsOf(resellerId)).results.map(toPayment);
  },

  async pay(input: PayCommissionInput): Promise<CommissionPayment> {
    return toPayment(await api.post<PayoutDto>(payouts, { resellerId: input.resellerId, amount: input.amount.toFixed(2), note: input.note ?? "" }, idempotent()));
  },
};
