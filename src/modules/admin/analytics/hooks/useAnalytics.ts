"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { analyticsService } from "../services/analytics.service";
import type { AnalyticsFilters } from "../types";

export function useAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["admin", "analytics", filters],
    queryFn: () => analyticsService.get(filters),
    placeholderData: keepPreviousData,
  });
}
