import { money } from "@/modules/products/services/products.mapper";
import { periodLabels, toSeries, toTopProduct, type ProductPerformanceDto, type SellerRankingDto, type SeriesDto, type SummaryDto } from "../../dashboard/services/dashboard.mapper";
import { PERIOD_TITLE } from "../../dashboard/lib/period";
import type { AnalyticsData, AnalyticsRange, ResellerPerformance, ResellerPerformanceRow, SlowMover } from "../types";

export interface CategoryPerformanceDto {
  categoryId: number;
  name: string;
  revenue: string;
  profit: string;
  units: number;
  marginRate: string | null;
  share: number;
}

/** `weekday` ISO : 1 = lundi … 7 = dimanche. */
export interface HeatCellDto {
  weekday: number;
  hour: number;
  salesCount: number;
  revenue: string;
}

export interface SlowMoverDto {
  productId: number;
  name: string;
  image: string;
  stock: number;
  lastSoldAt: string | null;
}

const DAY_MS = 86_400_000;
const FIRST_HOUR = 6;

const RANGE_TITLE: Record<AnalyticsRange, string> = { ...PERIOD_TITLE, "90d": "90 derniers jours", ytd: "Depuis le 1er janvier" };

export function toHeatmap(cells: HeatCellDto[]) {
  const first = Math.min(FIRST_HOUR, ...cells.filter((c) => c.salesCount > 0).map((c) => c.hour));
  const hours = Array.from({ length: 24 - first }, (_, i) => i + first);
  const heatmap = Array.from({ length: 7 }, () => hours.map(() => 0));
  for (const c of cells) heatmap[c.weekday - 1][c.hour - first] += c.salesCount;
  return { heatmap, heatmapHours: hours };
}

const toSlowMover = (dto: SlowMoverDto): SlowMover => ({
  id: dto.productId,
  name: dto.name,
  image: dto.image || null,
  stock: dto.stock,
  daysSinceLastSale: dto.lastSoldAt ? Math.floor((Date.now() - +new Date(dto.lastSoldAt)) / DAY_MS) : null,
});

const toSellerRow = (dto: SellerRankingDto): ResellerPerformanceRow => ({
  id: dto.sellerId,
  name: dto.name,
  revenue: Math.round(money(dto.revenue)),
  profit: Math.round(money(dto.profit)),
  salesCount: dto.salesCount,
  units: dto.units,
  share: dto.share,
});

export function toAnalytics(
  range: AnalyticsRange,
  parts: { summary: SummaryDto; series: SeriesDto; categories: CategoryPerformanceDto[]; top: ProductPerformanceDto[]; peaks: HeatCellDto[]; slow: SlowMoverDto[] },
): AnalyticsData {
  const { summary, categories } = parts;
  const series = toSeries(parts.series);
  const labels = periodLabels("30d", summary.start, summary.end);
  return {
    periodLabel: labels.periodLabel.replace(PERIOD_TITLE["30d"], RANGE_TITLE[range]),
    previousPeriodLabel: labels.previousPeriodLabel,
    summary: {
      revenue: Math.round(money(summary.revenue.value)),
      revenueDelta: summary.revenue.change,
      profit: Math.round(money(summary.profit.value)),
      profitDelta: summary.profit.change,
      sales: Number(summary.salesCount.value),
      salesDelta: summary.salesCount.change,
      avgBasket: money(summary.averageBasket.value),
      avgBasketDelta: summary.averageBasket.change,
    },
    monthly: { labels: series.labels, revenue: series.revenue, profit: series.profit },
    byCategory: categories.map((c) => ({ id: c.categoryId, name: c.name, value: Math.round(money(c.revenue)) })),
    topProducts: parts.top.map(toTopProduct),
    marginByCategory: categories.filter((c) => c.marginRate != null).map((c) => ({ name: c.name, margin: Number(c.marginRate) })),
    basket: { labels: series.labels, values: series.basket },
    ...toHeatmap(parts.peaks),
    slowMovers: { total: parts.slow.length, rows: parts.slow.map(toSlowMover) },
  };
}

export function toResellerPerformance(range: AnalyticsRange, sellers: SellerRankingDto[]): ResellerPerformance {
  return { periodLabel: RANGE_TITLE[range], rows: sellers.map(toSellerRow) };
}
