import { DB, type DbSale } from "@/shared/mock-db";
import { DAY } from "@/shared/mock-db/rng";
import {
  inPeriod,
  isValidSale,
  pctChange,
  periodDays,
  productOf,
  saleProfit,
  saleTotal,
  totals,
  type Period,
  type Totals,
} from "@/shared/mock-db/selectors";
import { formatDate } from "@/shared/lib/format";
import type { PaymentMethod } from "@/modules/orders/types";

/** Périodes proposées partout (tableau de bord, revendeurs, performance). */
export type PeriodKey = "7d" | "30d" | "12m";

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "7d", label: "7 j" },
  { value: "30d", label: "30 j" },
  { value: "12m", label: "12 mois" },
];

const DAYS: Record<PeriodKey, number> = { "7d": 7, "30d": 30, "12m": 365 };
export const PERIOD_TITLE: Record<PeriodKey, string> = { "7d": "7 derniers jours", "30d": "30 derniers jours", "12m": "12 derniers mois" };

export const periodOf = (key: PeriodKey): Period => {
  const p = periodDays(DAYS[key]);
  return { ...p, label: `${PERIOD_TITLE[key]} (${formatDate(p.from)} → ${formatDate(p.to)})` };
};

/** Période précédente de même durée (pour les variations). */
export function previousPeriod(p: Period): Period {
  const len = +p.to - +p.from;
  const from = new Date(+p.from - len);
  const to = new Date(+p.from);
  return { from, to, label: `${formatDate(from)} → ${formatDate(to)}` };
}

export const salesIn = (list: DbSale[], p: Period) => list.filter((s) => inPeriod(s, p));

export interface WithDelta {
  now: Totals;
  before: Totals;
  revenueDelta: number | null;
  profitDelta: number | null;
  countDelta: number | null;
}
export function compare(list: DbSale[], p: Period): WithDelta {
  const now = totals(salesIn(list, p));
  const before = totals(salesIn(list, previousPeriod(p)));
  return {
    now,
    before,
    revenueDelta: pctChange(now.revenue, before.revenue),
    profitDelta: pctChange(now.profit, before.profit),
    countDelta: pctChange(now.count, before.count),
  };
}

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const dayLabel = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const monthLabel = (d: Date) => MONTHS[d.getMonth()];

export interface Bucket {
  label: string;
  from: number;
  to: number;
}

/** Découpe une période en seaux : `day`, `3days` (≈ hebdo), ou `month` (calendaires). */
export function buckets(p: Period, mode: "day" | "step" | "month", stepDays = 7): Bucket[] {
  const out: Bucket[] = [];
  if (mode === "month") {
    const cur = new Date(p.from.getFullYear(), p.from.getMonth(), 1);
    while (+cur <= +p.to) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      out.push({ label: monthLabel(cur), from: +cur, to: +next });
      cur.setTime(+next);
    }
    return out;
  }
  const step = mode === "day" ? 1 : stepDays;
  for (let t = +new Date(p.from.getFullYear(), p.from.getMonth(), p.from.getDate()); t <= +p.to; t += step * DAY) {
    out.push({ label: dayLabel(new Date(t)), from: t, to: t + step * DAY });
  }
  return out;
}

export function seriesFor(list: DbSale[], bs: Bucket[]) {
  const revenue = bs.map(() => 0);
  const profit = bs.map(() => 0);
  const count = bs.map(() => 0);
  for (const s of list) {
    if (!isValidSale(s)) continue;
    const t = +new Date(s.soldAt);
    const i = bs.findIndex((b) => t >= b.from && t < b.to);
    if (i < 0) continue;
    revenue[i] += saleTotal(s);
    profit[i] += saleProfit(s);
    count[i] += 1;
  }
  return { labels: bs.map((b) => b.label), revenue: revenue.map(Math.round), profit: profit.map(Math.round), count };
}

export function byMethod(list: DbSale[]): { method: PaymentMethod; total: number }[] {
  const m = new Map<PaymentMethod, number>();
  for (const s of list) if (isValidSale(s)) m.set(s.method, (m.get(s.method) ?? 0) + saleTotal(s));
  return (["OrangeMoney", "AirtelMoney", "M-Pesa", "Cash"] as PaymentMethod[]).map((method) => ({ method, total: Math.round(m.get(method) ?? 0) }));
}

export function topProducts(list: DbSale[], limit = 5) {
  const m = new Map<number, { units: number; revenue: number }>();
  for (const s of list) {
    if (!isValidSale(s)) continue;
    const cur = m.get(s.productId) ?? { units: 0, revenue: 0 };
    cur.units += s.quantity;
    cur.revenue += saleTotal(s);
    m.set(s.productId, cur);
  }
  return [...m.entries()]
    .map(([id, v]) => {
      const p = productOf(id);
      return { id, name: p?.name ?? `Produit #${id}`, image: p?.image ?? null, units: v.units, revenue: Math.round(v.revenue) };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export const categoryOfSale = (s: DbSale) => productOf(s.productId)?.categoryId ?? null;
export const userName = (id: number | null) => {
  const u = DB.users.find((x) => x.id === id);
  return u ? `${u.firstName} ${u.lastName}` : "—";
};
