import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse, paginate, type Paginated } from "@/shared/lib/api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { displayName } from "@/modules/auth/types";
import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import { MOCK_ORDERS } from "../mocks/orders";
import type { CreateOrderInput, CreateOrderResult, Order, OrderItem, OrderListParams } from "../types";

export const ordersService = {
  /** Commandes de l'utilisateur connecté (filtre par statut). */
  list(params: OrderListParams = {}): Promise<Paginated<Order>> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const uid = useAuthStore.getState().user?.id;
        let list = MOCK_ORDERS.filter((o) => o.user.id === uid);
        if (params.status && params.status !== "all") list = list.filter((o) => o.status === params.status);
        list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        return paginate(list, params.page ?? 1, params.pageSize ?? 6);
      });
    }
    return api.get<Paginated<Order>>(ENDPOINTS.orders.list, {
      params: { status: params.status === "all" ? undefined : params.status, page: params.page, pageSize: params.pageSize },
    });
  },

  async detail(id: number): Promise<Order> {
    if (env.USE_MOCKS) {
      const found = MOCK_ORDERS.find((o) => o.id === id);
      if (!found) throw new ApiError(404, "Commande introuvable");
      return mockResponse(found);
    }
    return api.get<Order>(ENDPOINTS.orders.detail(id));
  },

  /** Crée la commande depuis le panier (+ discussion côté backend). */
  async create(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (env.USE_MOCKS) {
      const user = useAuthStore.getState().user;
      const items: OrderItem[] = input.items.map((it, i) => {
        const p = MOCK_PRODUCTS.find((x) => x.id === it.productId);
        if (!p) throw new ApiError(400, "Produit introuvable");
        return {
          id: Date.now() + i,
          productId: p.id,
          productName: p.name,
          productImage: p.image,
          quantity: it.quantity,
          unitPrice: p.priceSolde ?? p.price,
        };
      });
      const id = Math.max(0, ...MOCK_ORDERS.map((o) => o.id)) + 1;
      const order: Order = {
        id,
        createdAt: new Date().toISOString(),
        status: "attente",
        totalPrice: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
        items,
        user: { id: user?.id ?? 0, name: user ? displayName(user) : "Client", email: user?.email },
        assignedRevendeur: null,
        conversationId: id,
      };
      MOCK_ORDERS.unshift(order);
      return mockResponse({ order, conversationId: id }, 900);
    }
    return api.post<CreateOrderResult>(ENDPOINTS.orders.create, input);
  },
};
