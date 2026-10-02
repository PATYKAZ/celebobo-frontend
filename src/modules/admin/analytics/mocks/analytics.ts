import { DB, resellers, fullName } from "@/shared/mock-db";
import { DAY } from "@/shared/mock-db/rng";
import { isValidSale, pctChange, productOf, resellerStats, saleProfit, saleTotal, totals, visibleSales, type Period } from "@/shared/mock-db/selectors";
import { formatDate } from "@/shared/lib/format";
import { buckets, categoryOfSale, dayLabel, previousPeriod, salesIn, seriesFor, topProducts } from "../../dashboard/lib/stats";
import type { AnalyticsData, AnalyticsFilters, AnalyticsRange, ResellerPerformance, SlowMover } from "../types";

const RANGE_TITLE: Record<AnalyticsRange, string> = { "30d": "30 derniers jours", "90d": "90 derniers jours", "12m": "12 derniers mois", ytd: "Année en cours" };

export function rangePeriod(range: AnalyticsRange): Period {
  const to = new Date();
  const from = range === "ytd" ? new Date(to.getFullYear(), 0, 1) : new Date(+to - (range === "30d" ? 30 : range === "90d" ? 90 : 365) * DAY);
  return { from, to, label: `${RANGE_TITLE[range]} (${formatDate(from)} → ${formatDate(to)})` };
}

function filtered(f: AnalyticsFilters) {
  return visibleSales().filter((s) => (f.category === "all" || categoryOfSale(s) === f.category) && (f.method === "all" || s.method === f.method));
}

/** Valeur du stock (prix d'achat) à intervalles hebdomadaires, reconstruite depuis `DB.stockMovements`. */
function stockValueSeries() {
  const byProduct = new Map<number, { at: number; bal: number }[]>();
  for (const m of DB.stockMovements) {
    const arr = byProduct.get(m.productId) ?? [];
    arr.push({ at: +new Date(m.at), bal: m.balanceAfter });
    byProduct.set(m.productId, arr);
  }
  for (const arr of byProduct.values()) arr.sort((a, b) => a.at - b.at);

  const now = Date.now();
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 0; i <= 21; i++) {
    const t = now - (147 - i * 7) * DAY;
    let total = 0;
    for (const [pid, arr] of byProduct) {
      let bal: number | null = null;
      for (const m of arr) if (m.at <= t) bal = m.bal;
      if (bal != null) total += bal * (productOf(pid)?.pricePrimary ?? 0);
    }
    labels.push(dayLabel(new Date(t)));
    values.push(Math.round(total));
  }
  return { label: "150 derniers jours", labels, values, current: values[values.length - 1], first: values[0] };
}

function slowMovers(): AnalyticsData["slowMovers"] {
  const now = Date.now();
  const rows: SlowMover[] = [];
  for (const p of DB.products) {
    if (p.deletedAt || p.stock <= 0) continue;
    const sold = DB.sales.filter((s) => s.productId === p.id && isValidSale(s));
    const last = sold.reduce((m, s) => Math.max(m, +new Date(s.soldAt)), 0);
    const daysSince = last ? Math.floor((now - last) / DAY) : null;
    const units60 = sold.filter((s) => +new Date(s.soldAt) > now - 60 * DAY).reduce((n, s) => n + s.quantity, 0);
    const wishDays = p.dateWish ? Math.ceil((+new Date(p.dateWish) - now) / DAY) : null;
    const reasons: SlowMover["reasons"] = [];
    if (daysSince == null || daysSince >= 45 || units60 <= 1) reasons.push("rotation");
    if (wishDays != null && wishDays <= 14) reasons.push("echeance");
    if (!reasons.length) continue;
    rows.push({
      id: p.id,
      name: p.name,
      image: p.image,
      category: p.category,
      stock: p.stock,
      stockValue: Math.round(p.stock * (p.pricePrimary ?? 0)),
      daysSinceLastSale: daysSince,
      unitsSold60d: units60,
      dateWish: p.dateWish,
      dateWishDays: wishDays,
      reasons,
    });
  }
  rows.sort((a, b) => Number(b.reasons.includes("echeance")) - Number(a.reasons.includes("echeance")) || b.stockValue - a.stockValue);
  return { total: rows.length, rows: rows.slice(0, 10) };
}

/** Analytique = agrégations sur la base de démo unique (mêmes chiffres que Ventes / Tableau de bord). */
export function buildAnalytics(f: AnalyticsFilters): AnalyticsData {
  const period = rangePeriod(f.range);
  const prev = previousPeriod(period);
  const all = filtered(f);
  const inP = salesIn(all, period);
  const now = totals(inP);
  const before = totals(salesIn(all, prev));

  const mode = f.range === "30d" || f.range === "90d" ? "step" : "month";
  const bs = buckets(period, mode, f.range === "30d" ? 3 : 7);
  const series = seriesFor(inP, bs);
  const basket = series.revenue.map((rev, i) => (series.count[i] ? Math.round(rev / series.count[i]) : 0));

  const cats = new Map<number, { rev: number; profit: number }>();
  for (const s of inP) {
    if (!isValidSale(s)) continue;
    const id = categoryOfSale(s);
    if (id == null) continue;
    const c = cats.get(id) ?? { rev: 0, profit: 0 };
    c.rev += saleTotal(s);
    c.profit += saleProfit(s);
    cats.set(id, c);
  }
  const catName = (id: number) => DB.categories.find((c) => c.id === id)?.name ?? `Catégorie #${id}`;
  const byCategory = [...cats.entries()].map(([id, c]) => ({ id, name: catName(id), value: Math.round(c.rev) })).sort((a, b) => b.value - a.value);
  const marginByCategory = [...cats.entries()]
    .filter(([, c]) => c.rev > 0)
    .map(([id, c]) => ({ name: catName(id), margin: Math.round((c.profit / c.rev) * 1000) / 10 }))
    .sort((a, b) => b.margin - a.margin);

  const heatmapHours = Array.from({ length: 18 }, (_, i) => i + 6);
  const heatmap = Array.from({ length: 7 }, () => heatmapHours.map(() => 0));
  for (const s of inP) {
    if (!isValidSale(s)) continue;
    const d = new Date(s.soldAt);
    const day = (d.getDay() + 6) % 7;
    const h = d.getHours() - 6;
    if (h >= 0 && h < heatmapHours.length) heatmap[day][h] += 1;
  }

  return {
    periodLabel: period.label,
    previousPeriodLabel: prev.label,
    summary: {
      revenue: Math.round(now.revenue),
      revenueDelta: pctChange(now.revenue, before.revenue),
      profit: Math.round(now.profit),
      profitDelta: pctChange(now.profit, before.profit),
      sales: now.count,
      salesDelta: pctChange(now.count, before.count),
      avgBasket: Math.round(now.average),
      avgBasketDelta: pctChange(now.average, before.average),
    },
    monthly: { labels: series.labels, revenue: series.revenue, profit: series.profit },
    byCategory,
    topProducts: topProducts(inP, 8),
    marginByCategory,
    basket: { labels: series.labels, values: basket },
    heatmap,
    heatmapHours,
    stockValue: stockValueSeries(),
    slowMovers: slowMovers(),
  };
}

export function buildResellerPerformance(range: AnalyticsRange): ResellerPerformance {
  const period = rangePeriod(range);
  const rows = resellers()
    .map((u) => {
      const st = resellerStats(u.id, period);
      return {
        id: u.id,
        name: fullName(u),
        avatar: u.avatar,
        availability: u.availability ?? "offline",
        active: u.active,
        ordersAssigned: st.ordersAssigned,
        ordersDelivered: st.ordersDelivered,
        conversionRate: st.conversionRate,
        avgResponseMinutes: st.avgResponseMinutes,
        revenue: Math.round(st.salesRevenue),
        salesCount: st.salesCount,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
  return { periodLabel: period.label, rows };
}
