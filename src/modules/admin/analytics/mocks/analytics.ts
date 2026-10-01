import { MOCK_CATEGORIES } from "@/modules/categories/mocks/categories";
import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import { monthLabel, pct, rng, todayKey, dayLabel } from "../../dashboard/mocks/seeded";
import type { AnalyticsData, AnalyticsFilters } from "../types";

const METHOD_FACTOR = { OrangeMoney: 0.34, AirtelMoney: 0.24, "M-Pesa": 0.3, Cash: 0.12 } as const;

export function buildAnalytics(f: AnalyticsFilters): AnalyticsData {
  const r = rng(`${todayKey()}-an-${f.range}-${f.category}-${f.method}`);
  const now = new Date();
  const weekly = f.range === "30d" || f.range === "90d";
  const count = f.range === "30d" ? 10 : f.range === "90d" ? 13 : f.range === "12m" ? 12 : now.getMonth() + 1;
  const scale = (f.category === "all" ? 1 : 0.22 + r() * 0.15) * (f.method === "all" ? 1 : METHOD_FACTOR[f.method]);

  const labels: string[] = [];
  const revenue: number[] = [];
  const profit: number[] = [];
  const basket: number[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (weekly) d.setDate(d.getDate() - i * 3 * (f.range === "90d" ? 2.3 : 1));
    else d.setMonth(d.getMonth() - i);
    labels.push(weekly ? dayLabel(d) : monthLabel(d));
    const trend = 1 + ((count - i) / count) * 0.4;
    const rev = Math.round((weekly ? 3200 : 9800) * trend * scale * (0.6 + r() * 0.8));
    revenue.push(rev);
    profit.push(Math.round(rev * (0.16 + r() * 0.14)));
    basket.push(Math.round(240 + trend * 40 + r() * 70));
  }
  const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
  const totalRev = sum(revenue);
  const totalProfit = sum(profit);
  const sales = Math.round(totalRev / 295);
  const avg = Math.round(totalRev / Math.max(1, sales));

  const weights = MOCK_CATEGORIES.map((c) => (f.category === "all" || f.category === c.id ? 0.4 + r() : 0));
  const wsum = sum(weights) || 1;
  const byCategory = MOCK_CATEGORIES.map((c, i) => ({ id: c.id, name: c.name, value: Math.round((weights[i] / wsum) * totalRev) })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);

  const pool = MOCK_PRODUCTS.filter((p) => f.category === "all" || p.categoryId === f.category).sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0)).slice(0, 8);
  const topProducts = pool.map((p) => {
    const units = Math.max(1, Math.round((p.salesCount ?? 5) * (f.range === "12m" || f.range === "ytd" ? 1 : 0.3) * (0.8 + r() * 0.4)));
    return { id: p.id, name: p.name, image: p.image, units, revenue: units * (p.priceSolde ?? p.price) };
  }).sort((a, b) => b.revenue - a.revenue);

  const marginByCategory = byCategory.map((c) => ({ name: c.name, margin: Math.round((14 + r() * 24) * 10) / 10 }));

  const heatmapHours = Array.from({ length: 14 }, (_, i) => i + 8);
  const heatmap = Array.from({ length: 7 }, (_, d) =>
    heatmapHours.map((h) => {
      const peak = Math.exp(-((h - 13) ** 2) / 18) + 0.8 * Math.exp(-((h - 19) ** 2) / 6);
      const weekend = d >= 5 ? 1.25 : 1;
      return Math.round(peak * weekend * 9 * scale * (0.6 + r() * 0.8) + (scale > 0.5 ? 1 : 0));
    }),
  );

  const prevScale = 0.8 + r() * 0.15;
  return {
    summary: {
      revenue: totalRev,
      revenueDelta: pct(totalRev, totalRev * prevScale),
      profit: totalProfit,
      profitDelta: pct(totalProfit, totalProfit * (prevScale - 0.04)),
      sales,
      salesDelta: pct(sales, sales * (prevScale + 0.03)),
      avgBasket: avg,
      avgBasketDelta: pct(avg, avg * (0.93 + r() * 0.08)),
    },
    monthly: { labels, revenue, profit },
    byCategory,
    topProducts,
    marginByCategory,
    basket: { labels, values: basket },
    heatmap,
    heatmapHours,
  };
}
