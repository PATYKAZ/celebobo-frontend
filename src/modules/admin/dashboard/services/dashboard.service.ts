import { ENDPOINTS } from "@/config/endpoints";
import { api, downloadJob, runJob, type Job } from "@/shared/lib/api";
import type { DashboardData, DashboardPeriod } from "../types";
import {
  toDashboard,
  type OpenOrdersDto,
  type PaymentShareDto,
  type ProductPerformanceDto,
  type RecentSaleDto,
  type SellerRankingDto,
  type SeriesDto,
  type SummaryDto,
} from "./dashboard.mapper";

const { dashboard, analytics } = ENDPOINTS.admin;

export const dashboardService = {
  async get(period: DashboardPeriod): Promise<DashboardData> {
    const params = { period };
    const [summary, series, split, top, recent, open, sellers] = await Promise.all([
      api.get<SummaryDto>(dashboard.summary, { params }),
      api.get<SeriesDto>(dashboard.revenueSeries, { params }),
      api.get<PaymentShareDto[]>(dashboard.paymentSplit, { params }),
      api.get<ProductPerformanceDto[]>(dashboard.topProducts, { params: { ...params, limit: 5 } }),
      api.get<RecentSaleDto[]>(dashboard.recentSales),
      api.get<OpenOrdersDto>(dashboard.openOrders),
      api.get<SellerRankingDto[]>(analytics.sellers, { params }),
    ]);
    return toDashboard(period, { summary, series, split, top, recent, open, sellers });
  },

  /** Rapport PDF de la période (tâche asynchrone de l'API), téléchargé une fois prêt. */
  async downloadReport(period: DashboardPeriod): Promise<void> {
    downloadJob(await runJob(api.post<Job>(analytics.export, { period })));
  },
};
