import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse } from "@/shared/lib/api";
import { buildDashboard } from "../mocks/dashboard";
import type { DashboardData, DashboardPeriod } from "../types";

export const dashboardService = {
  get(period: DashboardPeriod): Promise<DashboardData> {
    if (env.USE_MOCKS) return mockResponse(() => buildDashboard(period), 500);
    return api.get<DashboardData>(ENDPOINTS.admin.dashboard, { params: { period } });
  },
  /** URL de l'export PDF du tableau de bord (backend : dashboard_pdf). */
  pdfUrl(period: DashboardPeriod): string {
    return api.url(ENDPOINTS.admin.dashboard, { period, format: "pdf" });
  },
};
