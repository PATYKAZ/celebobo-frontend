import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { can } from "@/modules/auth/permissions";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { DB, fullName, resellers, userById } from "@/shared/mock-db";
import { actorName, commissionFor, getActor, inPeriod, isValidSale, logAudit, nextId, periodMonth, saleTotal } from "@/shared/mock-db/selectors";
import type { CommissionPayment, CommissionRow, CommissionsOverview, PayCommissionInput } from "../types";

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const r2 = (n: number) => Math.round(n * 100) / 100;

function rowFor(id: number): CommissionRow {
  const u = userById(id)!;
  const c = commissionFor(id);
  const month = periodMonth(0);
  const mine = DB.sales.filter((s) => s.sellerId === id && isValidSale(s));
  const earnedMonth = mine.filter((s) => inPeriod(s, month)).reduce((n, s) => n + saleTotal(s) * c.rate, 0);
  return {
    resellerId: id,
    name: fullName(u),
    avatar: u.avatar,
    availability: u.availability ?? "offline",
    active: u.active,
    rate: c.rate,
    salesCount: mine.length,
    earned: r2(c.earned),
    earnedMonth: r2(earnedMonth),
    paid: r2(c.paid),
    due: r2(c.due),
    lastPaymentAt: c.payments[0]?.paidAt ?? null,
  };
}

const toPayment = (p: (typeof DB.commissionPayments)[number]): CommissionPayment => ({
  id: p.id,
  resellerId: p.resellerId,
  resellerName: fullName(userById(p.resellerId)!),
  amount: p.amount,
  paidAt: p.paidAt,
  note: p.note,
  paidByName: userById(p.paidBy) ? fullName(userById(p.paidBy)!) : "—",
});

const sum = (rows: CommissionRow[]) => ({
  earned: r2(rows.reduce((n, r) => n + r.earned, 0)),
  earnedMonth: r2(rows.reduce((n, r) => n + r.earnedMonth, 0)),
  paid: r2(rows.reduce((n, r) => n + r.paid, 0)),
  due: r2(rows.reduce((n, r) => n + r.due, 0)),
});

function buildOverview(): CommissionsOverview {
  const actor = getActor();
  const month = periodMonth(0);
  const base = { asOfLabel: `Cumul au ${formatDate(new Date())}`, monthLabel: month.label };

  if (can(actor, "commissions.view.all")) {
    const rows = resellers().map((u) => rowFor(u.id)).sort((a, b) => b.due - a.due);
    return { scope: "all", ...base, rows, totals: sum(rows) };
  }
  if (!can(actor, "commissions.view.own")) throw new ApiError(403, "Accès refusé");
  const row = rowFor(actor.id);
  const rate = row.rate;
  const now = new Date();
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const p = periodMonth(-i);
    labels.push(MONTHS[p.from.getMonth()]);
    values.push(r2(DB.sales.filter((s) => s.sellerId === actor.id && isValidSale(s) && inPeriod(s, { ...p, to: i === 0 ? now : p.to })).reduce((n, s) => n + saleTotal(s) * rate, 0)));
  }
  return {
    scope: "own",
    ...base,
    rows: [row],
    totals: sum([row]),
    monthly: { labels, values },
    payments: DB.commissionPayments.filter((p) => p.resellerId === actor.id).sort((a, b) => +new Date(b.paidAt) - +new Date(a.paidAt)).map(toPayment),
  };
}

export const commissionsService = {
  overview(): Promise<CommissionsOverview> {
    if (env.USE_MOCKS) return mockResponse(buildOverview, 400);
    const a = getActor();
    return api.get<CommissionsOverview>(can(a, "commissions.view.all") ? ENDPOINTS.admin.commissions.list : ENDPOINTS.admin.commissions.mine);
  },

  /** Historique des paiements d'un revendeur. */
  payments(resellerId: number): Promise<CommissionPayment[]> {
    if (env.USE_MOCKS) {
      const a = getActor();
      if (!can(a, "commissions.view.all") && a.id !== resellerId) return Promise.reject(new ApiError(403, "Accès refusé"));
      return mockResponse(() => DB.commissionPayments.filter((p) => p.resellerId === resellerId).sort((x, y) => +new Date(y.paidAt) - +new Date(x.paidAt)).map(toPayment), 250);
    }
    return api.get<CommissionPayment[]>(ENDPOINTS.admin.commissions.payments, { params: { resellerId } });
  },

  async pay(input: PayCommissionInput): Promise<CommissionPayment> {
    if (env.USE_MOCKS) {
      const actor = getActor();
      if (!can(actor, "commissions.pay")) throw new ApiError(403, "Seul un administrateur peut enregistrer un paiement.");
      const u = userById(input.resellerId);
      if (!u) throw new ApiError(404, "Revendeur introuvable");
      const due = commissionFor(input.resellerId).due;
      if (!(input.amount > 0)) throw new ApiError(400, "Montant invalide", { amount: ["Montant requis."] });
      if (input.amount > due + 0.005) throw new ApiError(400, "Montant supérieur au dû", { amount: [`Maximum : ${due.toFixed(2)} $.`] });
      const p = { id: nextId("payment"), resellerId: input.resellerId, amount: r2(input.amount), paidAt: new Date().toISOString(), note: input.note ?? null, paidBy: actor.id };
      DB.commissionPayments.push(p);
      logAudit({ action: "Commission payée", entity: "commission", entityId: p.id, summary: `Paiement de ${p.amount.toFixed(2)} $ à ${fullName(u)} par ${actorName(actor)}` });
      return mockResponse(toPayment(p), 500);
    }
    return api.post<CommissionPayment>(ENDPOINTS.admin.commissions.payments, input);
  },
};
