import { useAuthStore } from "@/modules/auth/store/auth.store";
import { can } from "@/modules/auth/permissions";
import type { User } from "@/modules/auth/types";
import { DB, fullName, userById, resellers, type DbAuditEntry, type DbSale, type DbUser } from "./index";
import { DAY } from "./rng";

/** Utilisateur courant côté mock (store d'auth). Repli : admin (SSR / tests). */
export function getActor(): Pick<User, "id" | "role" | "firstName" | "lastName"> {
  const u = useAuthStore.getState().user;
  if (u) return u;
  const a = DB.users.find((x) => x.id === 4)!;
  return { id: a.id, role: a.role, firstName: a.firstName, lastName: a.lastName };
}
export const actorName = (a: Pick<User, "firstName" | "lastName">) => `${a.firstName} ${a.lastName}`.trim();

// ───────── Ventes ─────────
export const productOf = (id: number) => DB.products.find((p) => p.id === id);
export const saleTotal = (s: DbSale) => s.unitPrice * s.quantity;
export const saleCost = (s: DbSale) => (productOf(s.productId)?.pricePrimary ?? 0) * s.quantity;
export const saleProfit = (s: DbSale) => saleTotal(s) - saleCost(s);
export const isValidSale = (s: DbSale) => s.status === "valide";

/** Ventes visibles par l'acteur : revendeur = les siennes ; responsable/admin = toutes. */
export function visibleSales(actor = getActor()): DbSale[] {
  return can(actor, "sales.view.all") ? DB.sales : DB.sales.filter((s) => s.sellerId === actor.id);
}

export interface Totals {
  revenue: number;
  profit: number;
  /** nombre de lignes de vente */
  count: number;
  /** unités vendues */
  units: number;
  average: number;
}
export function totals(list: DbSale[]): Totals {
  const v = list.filter(isValidSale);
  const revenue = v.reduce((n, s) => n + saleTotal(s), 0);
  const profit = v.reduce((n, s) => n + saleProfit(s), 0);
  return { revenue, profit, count: v.length, units: v.reduce((n, s) => n + s.quantity, 0), average: v.length ? revenue / v.length : 0 };
}

export interface Period {
  from: Date;
  to: Date;
  label: string;
}
const fmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
export const periodDays = (days: number): Period => {
  const to = new Date();
  const from = new Date(Date.now() - days * DAY);
  return { from, to, label: `${fmt.format(from)} → ${fmt.format(to)}` };
};
export const periodMonth = (offset = 0): Period => {
  const n = new Date();
  const from = new Date(n.getFullYear(), n.getMonth() + offset, 1);
  const to = offset === 0 ? n : new Date(n.getFullYear(), n.getMonth() + offset + 1, 0, 23, 59, 59);
  return { from, to, label: new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(from) };
};
export const inPeriod = (s: DbSale, p: Period) => {
  const t = +new Date(s.soldAt);
  return t >= +p.from && t <= +p.to;
};
export const pctChange = (now: number, before: number) => (before > 0 ? ((now - before) / before) * 100 : null);

// ───────── Revendeurs ─────────
export const invitedBy = (resellerId: number): DbUser[] => DB.users.filter((u) => u.invitedBy === resellerId && u.id !== resellerId);

export function commissionFor(resellerId: number) {
  const u = userById(resellerId);
  const rate = u?.commissionRate ?? 0.07;
  const mine = DB.sales.filter((s) => s.sellerId === resellerId && isValidSale(s));
  const earned = mine.reduce((n, s) => n + saleTotal(s) * rate, 0);
  const payments = DB.commissionPayments.filter((p) => p.resellerId === resellerId).sort((a, b) => +new Date(b.paidAt) - +new Date(a.paidAt));
  const paid = payments.reduce((n, p) => n + p.amount, 0);
  return { rate, earned, paid, due: Math.max(0, earned - paid), payments };
}

export function resellerStats(resellerId: number, period?: Period) {
  const list = DB.sales.filter((s) => s.sellerId === resellerId && (!period || inPeriod(s, period)));
  const t = totals(list);
  const assigned = DB.orders.filter((o) => o.assignedRevendeur?.id === resellerId);
  const delivered = assigned.filter((o) => o.status === "livree");
  const invites = invitedBy(resellerId);
  return {
    invitedCount: invites.length,
    invited: invites,
    salesRevenue: t.revenue,
    salesProfit: t.profit,
    salesCount: t.count,
    ordersAssigned: assigned.length,
    ordersOpen: assigned.filter((o) => !["livree", "annulee", "retournee"].includes(o.status)).length,
    ordersDelivered: delivered.length,
    /** commande → vente : part des commandes assignées menées à terme */
    conversionRate: assigned.length ? (delivered.length / assigned.length) * 100 : 0,
    /** délai moyen de première réponse (min) — pseudo-métrique déterministe */
    avgResponseMinutes: 4 + ((resellerId * 7) % 26),
    commission: commissionFor(resellerId),
  };
}

/** Meilleur revendeur (chiffre d'affaires) sur une période — cohérent avec la liste des revendeurs. */
export function topReseller(period?: Period) {
  const ranked = resellers()
    .map((u) => ({ user: u, revenue: totals(DB.sales.filter((s) => s.sellerId === u.id && (!period || inPeriod(s, period)))).revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  return ranked[0] ? { id: ranked[0].user.id, name: fullName(ranked[0].user), revenue: ranked[0].revenue } : null;
}

// ───────── Audit ─────────
export function logAudit(entry: Omit<DbAuditEntry, "id" | "at" | "actor"> & { actor?: DbAuditEntry["actor"] }) {
  const a = getActor();
  DB.auditLog.unshift({
    id: DB.seq.audit++,
    at: new Date().toISOString(),
    actor: entry.actor ?? { id: a.id, name: actorName(a), role: a.role },
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    summary: entry.summary,
    diff: entry.diff,
  });
}

export const nextId = (key: keyof typeof DB.seq) => DB.seq[key]++;
