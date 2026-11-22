import { ROLE_FROM_API } from "@/modules/auth/services/auth.mapper";
import { money } from "@/modules/products/services/products.mapper";
import { CANCEL_REASONS, SYSTEM_CANCEL_LABEL, type DeliveryAttempt, ORDER_STATUS_LABEL, type Order, type OrderAddress, type OrderItem, type OrderStatus, type OrderStatusEvent, type PaymentMethod, type ResellerAvailability } from "../types";

export type ApiOrderStatus = "pending" | "assigned" | "confirmed" | "paid" | "shipping" | "delivered" | "cancelled" | "returned";
export type ApiPaymentMethod = "orange_money" | "airtel_money" | "mpesa" | "cash";

/** Résumé de commande (listes `GET /me/orders/`, `GET /bo/orders/`). */
export interface OrderSummaryDto {
  id: number;
  number: string;
  status: ApiOrderStatus;
  createdAt: string;
  total: string;
  itemsCount: number;
  previewName: string;
  previewImage: string;
  clientName: string;
  resellerName: string | null;
  refundStatus?: "due" | "done" | null;
  /** Back-office, personnel qui assigne uniquement : revendeur actif qui a invité le client. */
  suggestedReseller?: { id: number; name: string; reason: string; invitedAt: string | null } | null;
}

export interface OrderLineDto {
  id: number;
  productId: number | null;
  variantId: number | null;
  /** Absent de l'API à ce jour : le lien produit n'est affiché que s'il est connu. */
  productSlug?: string | null;
  name: string;
  variantLabel: string;
  image: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface StatusEntryDto {
  status: ApiOrderStatus;
  at: string;
  actorRole: "client" | "reseller" | "manager" | "admin" | "system" | string;
  actorName: string | null;
  note: string;
}

export interface PersonDto {
  id: number;
  name: string;
  email?: string;
  phone?: string | null;
  availability: ResellerAvailability | null;
}

/** Détail (`GET /me/orders/{number}/` sans `client`, `GET /bo/orders/{id}/` avec). */
export interface OrderDto extends OrderSummaryDto {
  items: OrderLineDto[];
  address: OrderAddress;
  paymentMethod: ApiPaymentMethod | string;
  note: string;
  subtotal: string;
  discount: string;
  couponCode: string;
  /** points de fidélité utilisés (1 point = 1 $) et points gagnés une fois livrée */
  points?: string;
  pointsEarned?: string | null;
  shippingZone: string;
  shippingFee: string;
  deliveryMethod?: "delivery" | "pickup";
  pickupAddress?: string;
  deliveryEstimate?: string;
  awaitingShippingQuote?: boolean;
  refundDue?: string;
  refundedAt?: string | null;
  refundNote?: string;
  deliveryCode?: string | null;
  deliveryCodeAttempts?: number;
  deliveryCodeLocked?: boolean;
  rating?: { score: number; comment: string; createdAt: string } | null;
  canRate?: boolean;
  deliveryAttempts?: DeliveryAttempt[];
  cancelReason: string;
  history: StatusEntryDto[];
  allowedTransitions: ApiOrderStatus[];
  client?: PersonDto;
  reseller: PersonDto | null;
  conversationId: number | null;
  /** Back-office (revendeur) : téléphone, adresse et note du client masqués (7 jours après la livraison, ou commande annulée) */
  contactHidden?: boolean;
}

export const STATUS_FROM_API: Record<ApiOrderStatus, OrderStatus> = {
  pending: "attente",
  assigned: "assignee",
  confirmed: "confirmee",
  paid: "payee",
  shipping: "en_livraison",
  delivered: "livree",
  cancelled: "annulee",
  returned: "retournee",
};

export const STATUS_TO_API = Object.fromEntries(Object.entries(STATUS_FROM_API).map(([api, front]) => [front, api])) as Record<OrderStatus, ApiOrderStatus>;

export const PAYMENT_FROM_API: Record<ApiPaymentMethod, PaymentMethod> = {
  orange_money: "OrangeMoney",
  airtel_money: "AirtelMoney",
  mpesa: "M-Pesa",
  cash: "Cash",
};

export const PAYMENT_TO_API = Object.fromEntries(Object.entries(PAYMENT_FROM_API).map(([api, front]) => [front, api])) as Record<PaymentMethod, ApiPaymentMethod>;

export const toStatus = (s: string): OrderStatus => STATUS_FROM_API[s as ApiOrderStatus] ?? (s in ORDER_STATUS_LABEL ? (s as OrderStatus) : "attente");
export const toPaymentMethod = (p: string | null | undefined): PaymentMethod | null => (p ? (PAYMENT_FROM_API[p as ApiPaymentMethod] ?? null) : null);

const SYSTEM_NAME = "Celebobo";

function toEvent(dto: StatusEntryDto): OrderStatusEvent {
  const role = dto.actorRole in ROLE_FROM_API ? ROLE_FROM_API[dto.actorRole as keyof typeof ROLE_FROM_API] : "system";
  return { status: toStatus(dto.status), at: dto.at, by: { id: 0, name: dto.actorName || SYSTEM_NAME, role }, note: dto.note || null };
}

function toItem(dto: OrderLineDto): OrderItem {
  return {
    id: dto.id,
    productId: dto.productId,
    productSlug: dto.productSlug ?? null,
    productName: dto.name,
    productImage: dto.image || null,
    quantity: dto.quantity,
    unitPrice: money(dto.unitPrice),
    variantLabel: dto.variantLabel || null,
  };
}

const formatAddress = (a: OrderAddress) => [a.line1, a.quarter, a.city, a.country].filter(Boolean).join(", ");

const cancelLabel = (code: string) => CANCEL_REASONS.find((r) => r.value === code)?.label ?? SYSTEM_CANCEL_LABEL[code] ?? (code || null);

/** Commande de l'API (résumé ou détail) → `Order` du front. */
export function toOrder(dto: OrderSummaryDto | OrderDto): Order {
  const detail = "items" in dto ? dto : null;
  const reseller = detail?.reseller;
  return {
    id: dto.id,
    number: dto.number,
    createdAt: dto.createdAt,
    status: toStatus(dto.status),
    totalPrice: money(dto.total),
    items: detail?.items.map(toItem) ?? [],
    itemsCount: dto.itemsCount,
    previewName: dto.previewName || null,
    previewImage: dto.previewImage || null,
    user: detail?.client
      ? { id: detail.client.id, name: detail.client.name, email: detail.client.email, phone: detail.client.phone ?? null }
      : { id: 0, name: dto.clientName },
    suggestedReseller: dto.suggestedReseller ? { id: dto.suggestedReseller.id, name: dto.suggestedReseller.name, invitedAt: dto.suggestedReseller.invitedAt } : null,
    assignedRevendeur: reseller ? { id: reseller.id, name: reseller.name, availability: reseller.availability } : dto.resellerName ? { id: 0, name: dto.resellerName } : null,
    conversationId: detail?.conversationId ?? null,
    statusHistory: detail?.history.map(toEvent) ?? [],
    deliveryAddress: detail ? formatAddress(detail.address) || null : null,
    address: detail?.address ?? null,
    paymentMethod: toPaymentMethod(detail?.paymentMethod),
    note: detail?.note || null,
    convertedToSales: false,
    cancelReason: detail ? cancelLabel(detail.cancelReason) : null,
    cancelReasonCode: detail?.cancelReason || null,
    deliveryAttempts: detail?.deliveryAttempts ?? [],
    subtotal: detail ? money(detail.subtotal) : undefined,
    discount: detail ? money(detail.discount) : undefined,
    couponCode: detail?.couponCode || null,
    points: detail ? money(detail.points) : undefined,
    pointsEarned: detail?.pointsEarned == null ? null : money(detail.pointsEarned),
    shippingFee: detail ? money(detail.shippingFee) : undefined,
    shippingZone: detail?.shippingZone || null,
    pickup: detail?.deliveryMethod === "pickup",
    pickupAddress: detail?.pickupAddress || null,
    deliveryEstimate: detail?.deliveryEstimate || null,
    awaitingShippingQuote: detail?.awaitingShippingQuote ?? false,
    refundStatus: dto.refundStatus ?? null,
    refundDue: detail ? money(detail.refundDue) : undefined,
    refundedAt: detail?.refundedAt ?? null,
    refundNote: detail?.refundNote || null,
    deliveryCode: detail?.deliveryCode || null,
    deliveryCodeAttempts: detail?.deliveryCodeAttempts ?? 0,
    deliveryCodeLocked: detail?.deliveryCodeLocked ?? false,
    contactHidden: detail?.contactHidden ?? false,
    rating: detail?.rating ?? null,
    canRate: detail?.canRate ?? false,
    allowedTransitions: detail?.allowedTransitions.map(toStatus) ?? [],
  };
}
