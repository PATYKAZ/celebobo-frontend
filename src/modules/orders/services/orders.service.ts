import { ENDPOINTS } from "@/config/endpoints";
import { api, type Paginated } from "@/shared/lib/api";
import type { CancelOrderInput, CreateOrderInput, CreateOrderResult, Order, OrderListParams } from "../types";
import { PAYMENT_TO_API, STATUS_TO_API, toOrder, type OrderDto, type OrderSummaryDto } from "./orders.mapper";

export const ordersService = {
  /** Commandes du client connecté (filtre par statut). */
  list(params: OrderListParams = {}): Promise<Paginated<Order>> {
    return api.page<OrderSummaryDto, Order>(
      ENDPOINTS.orders.list,
      { params: { status: params.status && params.status !== "all" ? STATUS_TO_API[params.status] : undefined, page: params.page, pageSize: params.pageSize } },
      toOrder,
    );
  },

  /** Détail d'une commande par son numéro — réservé à son propriétaire. */
  async detail(number: string): Promise<Order> {
    return toOrder(await api.get<OrderDto>(ENDPOINTS.orders.detail(number)));
  },

  async cancel(number: string, input: CancelOrderInput): Promise<Order> {
    return toOrder(await api.post<OrderDto>(ENDPOINTS.orders.cancel(number), { reason: input.reason, details: input.details ?? "" }));
  },

  /** Facture PDF (lien direct, cookies de session). */
  invoiceUrl: (number: string) => api.url(ENDPOINTS.orders.invoice(number)),

  /** Passe la commande (+ discussion côté backend) ; `idempotencyKey` évite un doublon en cas de double envoi. */
  async create(input: CreateOrderInput, idempotencyKey: string): Promise<CreateOrderResult> {
    const dto = await api.post<OrderDto>(
      ENDPOINTS.orders.create,
      {
        lines: input.items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null, quantity: i.quantity })),
        paymentMethod: PAYMENT_TO_API[input.paymentMethod],
        couponCode: input.couponCode || null,
        addressId: input.addressId ?? null,
        address: input.addressId ? null : (input.address ?? null),
        note: input.note ?? "",
      },
      { headers: { "Idempotency-Key": idempotencyKey } },
    );
    const order = toOrder(dto);
    return { order, conversationId: order.conversationId };
  },
};
