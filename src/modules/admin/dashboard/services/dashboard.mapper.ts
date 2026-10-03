import { formatDate } from "@/shared/lib/format";
import { money } from "@/modules/products/services/products.mapper";
import { PAYMENT_FROM_API, type ApiPaymentMethod } from "@/modules/orders/services/orders.mapper";
import type { PaymentMethod } from "@/modules/orders/types";
import { PERIOD_TITLE, dayLabel, monthLabel } from "../lib/period";
import type { DashboardData, DashboardPendingOrder, DashboardPeriod, DashboardSale, DashboardTopProduct } from "../types";

/** Indicateur avec comparaison à la période précédente (`change` en %, null sans référence). */
export interface MetricDto {
  value: string;
  previous: string;
  change: number | null;
}

export interface SummaryDto {
  start: string;
  end: string;
  revenue: MetricDto;
  profit: MetricDto;
  salesCount: MetricDto;
  units: MetricDto;
  averageBasket: MetricDto;
  marginRate: string | null;
  todayRevenue: string;
  openOrders: number;
}

export interface SeriesDto {
  granularity: "day" | "month";
  points: { bucket: string; revenue: string; profit: string; salesCount: number; averageBasket: string }[];
}

export interface PaymentShareDto {
  paymentMethod: ApiPaymentMethod;
  revenue: string;
  salesCount: number;
  share: number;
}

export interface ProductPerformanceDto {
  productId: number;
  name: string;
  image: string;
  revenue: string;
  profit: string;
  units: number;
}

export interface RecentSaleDto {
  id: number;
  productName: string;
  productImage: string;
  quantity: number;
  total: string;
  paymentMethod: ApiPaymentMethod;
  status: string;
  sellerName: string;
  soldTo: string;
  soldAt: string;
}

export interface OpenOrdersDto {
  count: number;
  results: { id: number; number: string; status: string; createdAt: string; total: string; itemsCount: number; clientName: string; resellerName: string | null }[];
}

export interface SellerRankingDto {
  sellerId: number;
  name: string;
  revenue: string;
  profit: string;
  salesCount: number;
  units: number;
  share: number;
}

const PAYMENT_ORDER: PaymentMethod[] = ["OrangeMoney", "AirtelMoney", "M-Pesa", "Cash"];

/** « 30 derniers jours (02 sept. 2026 → 02 oct. 2026) » et la période précédente de même durée. */
export function periodLabels(key: DashboardPeriod, start: string, end: string) {
  const from = new Date(start);
  const to = new Date(end);
  const previousFrom = new Date(+from - (+to - +from));
  return {
    periodLabel: `${PERIOD_TITLE[key]} (${formatDate(from)} → ${formatDate(to)})`,
    previousPeriodLabel: `${formatDate(previousFrom)} → ${formatDate(from)}`,
  };
}

export function toSeries(dto: SeriesDto) {
  const label = (bucket: string) => (dto.granularity === "month" ? monthLabel(new Date(bucket)) : dayLabel(new Date(bucket)));
  return {
    labels: dto.points.map((p) => label(p.bucket)),
    revenue: dto.points.map((p) => Math.round(money(p.revenue))),
    profit: dto.points.map((p) => Math.round(money(p.profit))),
    basket: dto.points.map((p) => Math.round(money(p.averageBasket))),
  };
}

export function toMethods(dto: PaymentShareDto[]): { method: PaymentMethod; total: number }[] {
  const totals = new Map(dto.map((s) => [PAYMENT_FROM_API[s.paymentMethod], money(s.revenue)]));
  return PAYMENT_ORDER.map((method) => ({ method, total: Math.round(totals.get(method) ?? 0) }));
}

export const toTopProduct = (dto: ProductPerformanceDto): DashboardTopProduct => ({
  id: dto.productId,
  name: dto.name,
  image: dto.image || null,
  units: dto.units,
  revenue: Math.round(money(dto.revenue)),
});

const toSale = (dto: RecentSaleDto): DashboardSale => ({
  id: dto.id,
  productName: dto.productName,
  productImage: dto.productImage || null,
  buyer: dto.soldTo || "Client comptoir",
  seller: dto.sellerName,
  method: PAYMENT_FROM_API[dto.paymentMethod],
  priceFinal: money(dto.total),
  date: dto.soldAt,
});

const toOpenOrder = (dto: OpenOrdersDto["results"][number]): DashboardPendingOrder => ({
  id: dto.id,
  number: dto.number,
  buyer: dto.clientName,
  total: money(dto.total),
  createdAt: dto.createdAt,
  itemsCount: dto.itemsCount,
  assignedTo: dto.resellerName,
});

export function toDashboard(
  key: DashboardPeriod,
  parts: { summary: SummaryDto; series: SeriesDto; split: PaymentShareDto[]; top: ProductPerformanceDto[]; recent: RecentSaleDto[]; open: OpenOrdersDto; sellers: SellerRankingDto[] },
): DashboardData {
  const { summary, open } = parts;
  const series = toSeries(parts.series);
  const best = parts.sellers[0];
  return {
    periodKey: key,
    ...periodLabels(key, summary.start, summary.end),
    kpis: {
      revenue: Math.round(money(summary.revenue.value)),
      revenueDelta: summary.revenue.change,
      profit: Math.round(money(summary.profit.value)),
      profitDelta: summary.profit.change,
      dayRevenue: Math.round(money(summary.todayRevenue)),
      sales: Number(summary.salesCount.value),
      salesDelta: summary.salesCount.change,
      avgBasket: money(summary.averageBasket.value),
      avgBasketDelta: summary.averageBasket.change,
      openOrders: open.count,
      unassignedOrders: open.results.filter((o) => !o.resellerName).length,
    },
    series: { labels: series.labels, revenue: series.revenue, profit: series.profit },
    methods: toMethods(parts.split),
    topProducts: parts.top.map(toTopProduct),
    recentSales: parts.recent.map(toSale),
    pendingOrders: open.results.slice(0, 5).map(toOpenOrder),
    topReseller: best ? { id: best.sellerId, name: best.name, revenue: Math.round(money(best.revenue)) } : null,
  };
}
