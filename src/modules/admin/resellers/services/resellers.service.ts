import { ENDPOINTS } from "@/config/endpoints";
import { api, type PageEnvelope } from "@/shared/lib/api";
import { money } from "@/modules/products/services/products.mapper";
import { STATUS_TO_API } from "@/modules/orders/services/orders.mapper";
import { ORDER_FINAL } from "@/modules/orders/types";
import { PERIOD_TITLE, type PeriodKey } from "../../dashboard/lib/period";
import type { CreateResellerInput, Reseller, ResellerListParams, ResellersResponse } from "../types";
import { toInvitedClient, toReseller, type InviteeDto, type ResellerDto, type SellerSalesDto } from "./resellers.mapper";

const { resellers, users, analytics, orders } = ENDPOINTS.admin;

interface ResellerStatsDto {
  total: number;
  active: number;
  invitedClients: number;
  pendingApplications: number;
  topReseller: { id: number; name: string; revenue: string } | null;
}

const salesBySeller = async (period: PeriodKey) =>
  new Map((await api.get<SellerSalesDto[]>(analytics.sellers, { params: { period } })).map((s) => [s.sellerId, s]));

/** Commandes assignées (tous statuts), en cours et livrées d'un revendeur. */
async function orderLoad(resellerId: number) {
  const page = await api.get<PageEnvelope<unknown>>(orders.list, { params: { resellerId, pageSize: 1 } });
  const counts = (page.meta.counts ?? {}) as Record<string, number>;
  const statuses = Object.entries(STATUS_TO_API);
  const assigned = statuses.reduce((n, [, api]) => n + (counts[api] ?? 0), 0);
  const open = statuses.filter(([front]) => !ORDER_FINAL.includes(front as never)).reduce((n, [, api]) => n + (counts[api] ?? 0), 0);
  const delivered = counts.delivered ?? 0;
  return { ordersAssigned: assigned, ordersOpen: open, conversionRate: assigned ? (delivered / assigned) * 100 : 0 };
}

export const resellersService = {
  async list(params: ResellerListParams = {}): Promise<ResellersResponse> {
    const period = params.period ?? "30d";
    const ordering = params.ordering === "-sales" ? undefined : params.ordering;
    const [page, sales, stats] = await Promise.all([
      api.get<PageEnvelope<ResellerDto>>(resellers.list, {
        params: { search: params.search || undefined, active: params.status && params.status !== "all" ? params.status === "actif" : undefined, ordering, page: params.page, pageSize: params.pageSize },
      }),
      salesBySeller(period),
      api.get<ResellerStatsDto>(resellers.stats),
    ]);
    const results = page.results.map((dto) => toReseller(dto, sales.get(dto.id)));
    if (params.ordering === "-sales") results.sort((a, b) => b.salesTotal - a.salesTotal);
    return {
      count: page.meta.count,
      next: page.next,
      previous: page.previous,
      results,
      page: page.meta.page,
      pageSize: page.meta.pageSize,
      totalPages: page.meta.totalPages,
      periodLabel: PERIOD_TITLE[period],
      stats: {
        total: stats.total,
        active: stats.active,
        invited: stats.invitedClients,
        topId: stats.topReseller?.id ?? null,
        topName: stats.topReseller?.name ?? null,
        topSales: stats.topReseller ? money(stats.topReseller.revenue) : 0,
      },
    };
  },

  async detail(id: number, period: PeriodKey = "30d"): Promise<Reseller> {
    const [dto, sales, invitees, load] = await Promise.all([
      api.get<ResellerDto>(resellers.detail(id)),
      salesBySeller(period),
      api.get<PageEnvelope<InviteeDto>>(resellers.invitees(id), { params: { pageSize: 100 } }),
      orderLoad(id),
    ]);
    return toReseller(dto, sales.get(id), { ...load, invited: invitees.results.map(toInvitedClient) });
  },

  /** Crée le compte (rôle revendeur, e-mail d'invitation envoyé par l'API) puis fixe son taux. */
  async create(input: CreateResellerInput): Promise<Reseller> {
    const user = await api.post<{ id: number }>(users.list, { firstName: input.firstName, lastName: input.lastName, email: input.email, phoneNumber: input.phone || null, role: "reseller" });
    if (input.commissionRate != null) await api.patch(resellers.detail(user.id), { commissionRate: input.commissionRate.toFixed(3) });
    return toReseller(await api.get<ResellerDto>(resellers.detail(user.id)));
  },

  async setActive(id: number, active: boolean): Promise<Reseller> {
    return toReseller(await api.post<ResellerDto>(active ? resellers.activate(id) : resellers.deactivate(id)));
  },

  async updateRate(id: number, rate: number): Promise<Reseller> {
    return toReseller(await api.patch<ResellerDto>(resellers.detail(id), { commissionRate: rate.toFixed(3) }));
  },
};
