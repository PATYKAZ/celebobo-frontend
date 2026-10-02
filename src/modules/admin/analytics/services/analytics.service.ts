import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse } from "@/shared/lib/api";
import { buildAnalytics, buildResellerPerformance } from "../mocks/analytics";
import type { AnalyticsData, AnalyticsFilters, AnalyticsRange, ResellerPerformance } from "../types";

export const analyticsService = {
  get(filters: AnalyticsFilters): Promise<AnalyticsData> {
    if (env.USE_MOCKS) return mockResponse(() => buildAnalytics(filters), 450);
    return api.get<AnalyticsData>(ENDPOINTS.admin.analytics, {
      params: { range: filters.range, category: filters.category === "all" ? undefined : filters.category, method: filters.method === "all" ? undefined : filters.method },
    });
  },

  /** Performance par revendeur (permission `analytics.resellers`). */
  resellerPerformance(range: AnalyticsRange): Promise<ResellerPerformance> {
    if (env.USE_MOCKS) return mockResponse(() => buildResellerPerformance(range), 400);
    return api.get<ResellerPerformance>(`${ENDPOINTS.admin.analytics}resellers/`, { params: { range } });
  },
};
