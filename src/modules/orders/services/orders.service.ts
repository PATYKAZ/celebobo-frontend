import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse, paginate, type Paginated } from "@/shared/lib/api";
import { channels, realtime, type UserEvent } from "@/shared/lib/realtime";
import { DB } from "@/shared/mock-db";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { displayName } from "@/modules/auth/types";
import { MOCK_ORDERS } from "../mocks/orders";
import { fromLegacyStatus, type CreateOrderInput, type CreateOrderResult, type Order, type OrderItem, type OrderListParams } from "../types";

/** Compat API v1 : normalise les anciens statuts (traitement / terminé) vers le cycle v2. */
const normalize = (o: Order): Order => ({ ...o, status: fromLegacyStatus(o.status), statusHistory: o.statusHistory ?? [], convertedToSales: o.convertedToSales ?? false });

/** Identifiant du responsable notifié des nouvelles commandes (mock). */
const MANAGER_ID = 3;

export const ordersService = {
  /** Commandes de l'utilisateur connecté (filtre par statut). */
  async list(params: OrderListParams = {}): Promise<Paginated<Order>> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const uid = useAuthStore.getState().user?.id;
        let list = MOCK_ORDERS.filter((o) => o.user.id === uid);
        if (params.status && params.status !== "all") list = list.filter((o) => o.status === params.status);
        list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        return paginate(list, params.page ?? 1, params.pageSize ?? 6);
      });
    }
    const res = await api.get<Paginated<Order>>(ENDPOINTS.orders.list, {
      params: { status: params.status === "all" ? undefined : params.status, page: params.page, pageSize: params.pageSize },
    });
    return { ...res, results: res.results.map(normalize) };
  },

  /** Détail d'une commande — réservé à son propriétaire. */
  async detail(id: number): Promise<Order> {
    if (env.USE_MOCKS) {
      const found = MOCK_ORDERS.find((o) => o.id === id);
      const uid = useAuthStore.getState().user?.id;
      if (!found || found.user.id !== uid) throw new ApiError(404, "Commande introuvable");
      return mockResponse(found);
    }
    return normalize(await api.get<Order>(ENDPOINTS.orders.detail(id)));
  },

  /** Crée la commande depuis le panier (+ discussion côté backend). */
  async create(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (env.USE_MOCKS) {
      const user = useAuthStore.getState().user;
      const items: OrderItem[] = input.items.map((it, i) => {
        const p = DB.products.find((x) => x.id === it.productId);
        if (!p) throw new ApiError(400, "Produit introuvable");
        const variant = it.variantId ? p.variants.find((v) => v.id === it.variantId) : undefined;
        return {
          id: Date.now() + i,
          productId: p.id,
          productName: p.name,
          productImage: variant?.image ?? p.image,
          quantity: it.quantity,
          unitPrice: variant?.price ?? p.priceSolde ?? p.price,
          variantLabel: variant?.label ?? null,
        };
      });
      const saved = input.addressId ? DB.addresses.find((a) => a.id === input.addressId) : undefined;
      const deliveryAddress = saved
        ? `${saved.line1}, ${saved.quarter}, ${saved.city}`
        : [input.deliveryAddress, input.deliveryQuarter, input.deliveryCountry].filter(Boolean).join(", ") || null;
      const id = DB.seq.order++;
      const now = new Date().toISOString();
      const who = { id: user?.id ?? 0, name: user ? displayName(user) : "Client", role: "client" as const };
      const order: Order = {
        id,
        createdAt: now,
        status: "attente",
        totalPrice: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
        items,
        user: { id: who.id, name: who.name, email: user?.email, phone: user?.phoneNumber ?? null },
        assignedRevendeur: null,
        conversationId: id,
        statusHistory: [{ status: "attente", at: now, by: who, note: "Commande passée" }],
        deliveryAddress,
        paymentMethod: input.paymentMethod ?? null,
        note: input.note ?? null,
        convertedToSales: false,
      };
      MOCK_ORDERS.unshift(order);
      // Le responsable est notifié en temps réel
      realtime.emit<UserEvent>(channels.user(MANAGER_ID), { type: "notification", notificationId: Date.now() });
      return mockResponse({ order, conversationId: id }, 900);
    }
    const res = await api.post<CreateOrderResult>(ENDPOINTS.orders.create, input);
    return { ...res, order: normalize(res.order) };
  },
};
