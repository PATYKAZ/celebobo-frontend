import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { can } from "@/modules/auth/permissions";
import { ORDER_FINAL, type Order, type OrderStatus } from "@/modules/orders/types";
import { api, ApiError, mockResponse, paginate } from "@/shared/lib/api";
import { DB, fullName, resellers } from "@/shared/mock-db";
import { getActor, periodMonth } from "@/shared/mock-db/selectors";
import type { AdminOrderCounts, AdminOrderListParams, AdminOrderPage, ResellerOption } from "../types";

const STATUSES: OrderStatus[] = ["attente", "assignee", "confirmee", "payee", "en_livraison", "livree", "annulee", "retournee"];
const IN_PROGRESS: OrderStatus[] = ["assignee", "confirmee", "payee", "en_livraison"];

/** Commandes visibles par l'acteur : revendeur = les siennes ; responsable/admin = toutes. */
function scoped(): Order[] {
  const a = getActor();
  return can(a, "orders.view.all") ? DB.orders : DB.orders.filter((o) => o.assignedRevendeur?.id === a.id);
}

function applyFilters(list: Order[], p: AdminOrderListParams): Order[] {
  const q = p.search?.trim().toLowerCase().replace(/^#/, "");
  return list.filter((o) => {
    if (q && !`${o.user.name} ${o.user.email ?? ""} ${o.id}`.toLowerCase().includes(q)) return false;
    if (p.resellerId && o.assignedRevendeur?.id !== p.resellerId) return false;
    if (p.dateFrom && +new Date(o.createdAt) < +new Date(p.dateFrom)) return false;
    if (p.dateTo && +new Date(o.createdAt) > +new Date(p.dateTo) + 86400000 - 1) return false;
    if (p.minAmount != null && o.totalPrice < p.minAmount) return false;
    if (p.maxAmount != null && o.totalPrice > p.maxAmount) return false;
    return true;
  });
}

const find = (id: number) => {
  const o = scoped().find((x) => x.id === id);
  if (!o) throw new ApiError(404, "Commande introuvable");
  return o;
};

export const adminOrdersService = {
  list(params: AdminOrderListParams = {}): Promise<AdminOrderPage> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const base = applyFilters(scoped(), params).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        const counts = Object.fromEntries([["all", base.length], ["unassigned", base.filter((o) => !o.assignedRevendeur && !ORDER_FINAL.includes(o.status)).length], ...STATUSES.map((s) => [s, base.filter((o) => o.status === s).length])]) as AdminOrderCounts;
        const tab = params.status ?? "all";
        const list = tab === "all" ? base : tab === "unassigned" ? base.filter((o) => !o.assignedRevendeur && !ORDER_FINAL.includes(o.status)) : base.filter((o) => o.status === tab);
        const month = periodMonth(0);
        const all = scoped();
        return {
          ...paginate(list, params.page ?? 1, params.pageSize ?? 10),
          counts,
          kpis: {
            toAssign: all.filter((o) => o.status === "attente" && !o.assignedRevendeur).length,
            inProgress: all.filter((o) => IN_PROGRESS.includes(o.status)).length,
            deliveredThisMonth: all.filter((o) => o.status === "livree" && +new Date(o.statusHistory.find((h) => h.status === "livree")?.at ?? o.createdAt) >= +month.from).length,
            periodLabel: month.label,
          },
        };
      }, 300);
    }
    return api.get<AdminOrderPage>(ENDPOINTS.admin.orders.list, { params: params as never });
  },

  detail(id: number): Promise<Order> {
    if (env.USE_MOCKS) return mockResponse(() => find(id), 250);
    return api.get<Order>(ENDPOINTS.admin.orders.detail(id));
  },

  /** Tous les revendeurs (actifs + désactivés) avec disponibilité et charge. */
  resellers(): Promise<ResellerOption[]> {
    if (env.USE_MOCKS) {
      return mockResponse(
        () =>
          resellers().map((u) => ({
            id: u.id,
            name: fullName(u),
            code: u.codeRevendeur ?? "—",
            avatar: u.avatar,
            active: u.active,
            availability: u.availability ?? "offline",
            openOrders: DB.orders.filter((o) => o.assignedRevendeur?.id === u.id && !ORDER_FINAL.includes(o.status)).length,
          })),
        150,
      );
    }
    return api.get<ResellerOption[]>(ENDPOINTS.admin.resellers.list, { params: { pageSize: 100, withLoad: true } });
  },
};
