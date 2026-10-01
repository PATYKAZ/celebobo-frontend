import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse, paginate } from "@/shared/lib/api";
import { MOCK_ORDERS, MOCK_RESELLERS_LITE } from "@/modules/orders/mocks/orders";
import type { Order } from "@/modules/orders/types";
import type { AdminOrderListParams, AdminOrderPage, Reseller } from "../types";

const find = (id: number) => {
  const o = MOCK_ORDERS.find((x) => x.id === id);
  if (!o) throw new ApiError(404, "Commande introuvable");
  return o;
};

export const adminOrdersService = {
  list(params: AdminOrderListParams = {}): Promise<AdminOrderPage> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const all = [...MOCK_ORDERS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        const q = params.search?.toLowerCase();
        const searched = q ? all.filter((o) => `${o.user.name} #${o.id}`.toLowerCase().includes(q)) : all;
        const list = params.status && params.status !== "all" ? searched.filter((o) => o.status === params.status) : searched;
        const counts = {
          all: searched.length,
          attente: searched.filter((o) => o.status === "attente").length,
          traitement: searched.filter((o) => o.status === "traitement").length,
          terminé: searched.filter((o) => o.status === "terminé").length,
        };
        return { ...paginate(list, params.page ?? 1, params.pageSize ?? 8), counts };
      }, 300);
    }
    return api.get<AdminOrderPage>(ENDPOINTS.admin.orders.list, { params: params as never });
  },

  resellers(): Promise<Reseller[]> {
    if (env.USE_MOCKS) return mockResponse(MOCK_RESELLERS_LITE, 150);
    return api.get<Reseller[]>(ENDPOINTS.admin.resellers.list, { params: { pageSize: 100 } });
  },

  async assign(orderId: number, revendeurId: number): Promise<Order> {
    if (env.USE_MOCKS) {
      const o = find(orderId);
      const r = MOCK_RESELLERS_LITE.find((x) => x.id === revendeurId);
      if (!r) throw new ApiError(400, "Revendeur introuvable");
      o.assignedRevendeur = r;
      if (o.status === "attente") o.status = "traitement";
      return mockResponse(o, 500);
    }
    return api.post<Order>(ENDPOINTS.admin.orders.assign(orderId), { revendeurId });
  },

  /** Clôture la discussion liée → commande « terminé ». */
  async conclude(order: Order): Promise<Order> {
    if (env.USE_MOCKS) {
      const o = find(order.id);
      o.status = "terminé";
      return mockResponse(o, 500);
    }
    if (order.conversationId == null) throw new ApiError(400, "Aucune discussion liée à cette commande.");
    return api.post<Order>(ENDPOINTS.admin.conversations.conclude(order.conversationId));
  },
};
