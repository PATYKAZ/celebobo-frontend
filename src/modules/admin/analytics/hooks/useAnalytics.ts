"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { analyticsService } from "../services/analytics.service";
import type { AnalyticsFilters, AnalyticsRange } from "../types";

export function useAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["admin", "analytics", filters],
    queryFn: () => analyticsService.get(filters),
    placeholderData: keepPreviousData,
  });
}

export function useResellerPerformance(range: AnalyticsRange, enabled = true) {
  return useQuery({
    queryKey: ["admin", "analytics", "resellers", range],
    queryFn: () => analyticsService.resellerPerformance(range),
    placeholderData: keepPreviousData,
    enabled,
  });
}
