import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse } from "@/shared/lib/api";
import { buildAnalytics } from "../mocks/analytics";
import type { AnalyticsData, AnalyticsFilters } from "../types";

export const analyticsService = {
  get(filters: AnalyticsFilters): Promise<AnalyticsData> {
    if (env.USE_MOCKS) return mockResponse(() => buildAnalytics(filters), 550);
    return api.get<AnalyticsData>(ENDPOINTS.admin.analytics, {
      params: { range: filters.range, category: filters.category === "all" ? undefined : filters.category, method: filters.method === "all" ? undefined : filters.method },
    });
  },
};
