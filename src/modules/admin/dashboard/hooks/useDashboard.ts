"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";
import type { DashboardPeriod } from "../types";

export const dashboardKeys = { get: (p: DashboardPeriod) => ["admin", "dashboard", p] as const };

export function useDashboard(period: DashboardPeriod) {
  return useQuery({
    queryKey: dashboardKeys.get(period),
    queryFn: () => dashboardService.get(period),
    placeholderData: keepPreviousData,
  });
}
