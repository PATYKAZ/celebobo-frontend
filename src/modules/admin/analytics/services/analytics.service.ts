import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { PAYMENT_TO_API } from "@/modules/orders/services/orders.mapper";
import type { ProductPerformanceDto, SellerRankingDto, SeriesDto, SummaryDto } from "../../dashboard/services/dashboard.mapper";
import type { AnalyticsData, AnalyticsFilters, AnalyticsRange, ResellerPerformance } from "../types";
import { toAnalytics, toResellerPerformance, type CategoryPerformanceDto, type HeatCellDto, type SlowMoverDto } from "./analytics.mapper";

const { dashboard, analytics } = ENDPOINTS.admin;

const toParams = (f: AnalyticsFilters) => ({
  period: f.range,
  categoryId: f.category === "all" ? undefined : f.category,
  paymentMethod: f.method === "all" ? undefined : PAYMENT_TO_API[f.method],
});

export const analyticsService = {
  async get(filters: AnalyticsFilters): Promise<AnalyticsData> {
    const params = toParams(filters);
    const [summary, series, categories, top, peaks, slow] = await Promise.all([
      api.get<SummaryDto>(dashboard.summary, { params }),
      api.get<SeriesDto>(dashboard.revenueSeries, { params }),
      api.get<CategoryPerformanceDto[]>(analytics.categories, { params }),
      api.get<ProductPerformanceDto[]>(dashboard.topProducts, { params: { ...params, limit: 6 } }),
      api.get<HeatCellDto[]>(analytics.peakHours, { params }),
      api.get<SlowMoverDto[]>(analytics.slowMovers, { params }),
    ]);
    return toAnalytics(filters.range, { summary, series, categories, top, peaks, slow });
  },

  /** Classement des vendeurs (permission `analytics.resellers`). */
  async resellerPerformance(range: AnalyticsRange): Promise<ResellerPerformance> {
    return toResellerPerformance(range, await api.get<SellerRankingDto[]>(analytics.sellers, { params: { period: range } }));
  },
};
