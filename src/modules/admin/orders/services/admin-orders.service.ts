import { ENDPOINTS } from "@/config/endpoints";
import { api, type PageEnvelope } from "@/shared/lib/api";
import { STATUS_TO_API, toOrder, type ApiOrderStatus, type OrderDto, type OrderSummaryDto } from "@/modules/orders/services/orders.mapper";
import type { Order, OrderStatus } from "@/modules/orders/types";
import type { ResellerAvailability } from "@/modules/auth/types";
import type { AdminOrderCounts, AdminOrderListParams, AdminOrderPage, ResellerOption } from "../types";

const { orders, resellers } = ENDPOINTS.admin;

const STATUSES: OrderStatus[] = ["attente", "assignee", "confirmee", "payee", "en_livraison", "livree", "annulee", "retournee"];
const IN_PROGRESS: OrderStatus[] = ["assignee", "confirmee", "payee", "en_livraison"];

interface AssignableResellerDto {
  id: number;
  name: string;
  availability: ResellerAvailability;
  openOrders: number;
}

const filters = (p: AdminOrderListParams) => ({
  search: p.search?.trim().replace(/^#/, "") || undefined,
  resellerId: p.resellerId,
  dateFrom: p.dateFrom,
  dateTo: p.dateTo,
});

function toCounts(raw: Record<string, number> = {}): AdminOrderCounts {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, raw[STATUS_TO_API[s]] ?? 0])) as Record<OrderStatus, number>;
  return { ...byStatus, all: STATUSES.reduce((n, s) => n + byStatus[s], 0), unassigned: raw.unassigned ?? 0 };
}

const monthStart = () => {
  const now = new Date();
  return { iso: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), label: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) };
};

export const adminOrdersService = {
  /** Liste filtrée ; le montant min/max est appliqué sur la page reçue (l'API ne filtre pas les montants). */
  async list(params: AdminOrderListParams = {}): Promise<AdminOrderPage> {
    const tab = params.status ?? "all";
    const status: ApiOrderStatus | "unassigned" | undefined = tab === "all" ? undefined : tab === "unassigned" ? "unassigned" : STATUS_TO_API[tab];
    const month = monthStart();
    const [page, delivered] = await Promise.all([
      api.page<OrderSummaryDto, Order>(orders.list, { params: { ...filters(params), status, page: params.page, pageSize: params.pageSize } }, toOrder),
      api.get<PageEnvelope<OrderSummaryDto>>(orders.list, { params: { status: "delivered", dateFrom: month.iso, pageSize: 1 } }),
    ]);
    const results = page.results.filter((o) => (params.minAmount == null || o.totalPrice >= params.minAmount) && (params.maxAmount == null || o.totalPrice <= params.maxAmount));
    const counts = toCounts(page.meta?.counts as Record<string, number> | undefined);
    return {
      ...page,
      results,
      counts,
      kpis: {
        toAssign: counts.unassigned,
        inProgress: IN_PROGRESS.reduce((n, s) => n + counts[s], 0),
        deliveredThisMonth: delivered.meta.count,
        periodLabel: month.label,
      },
    };
  },

  async detail(id: number): Promise<Order> {
    return toOrder(await api.get<OrderDto>(orders.detail(id)));
  },

  /** Revendeurs actifs assignables, avec disponibilité et charge. */
  async resellers(): Promise<ResellerOption[]> {
    const list = await api.get<AssignableResellerDto[]>(resellers.assignable);
    return list.map((r) => ({ id: r.id, name: r.name, code: "—", avatar: null, active: true, availability: r.availability, openOrders: r.openOrders }));
  },
};
