import type { CartItem } from "@/modules/cart/types";

/** shop.models.Order.status */
export type OrderStatus = "attente" | "traitement" | "terminé";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  attente: "En attente",
  traitement: "En traitement",
  terminé: "Terminée",
};

export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  createdAt: string;
  status: OrderStatus;
  totalPrice: number;
  items: OrderItem[];
  user: { id: number; name: string; email?: string };
  assignedRevendeur: { id: number; name: string } | null;
  /** Discussion liée (conversation créée à la commande). */
  conversationId: number | null;
}

export interface OrderListParams {
  status?: OrderStatus | "all";
  page?: number;
  pageSize?: number;
}

/**
 * Création d'une commande depuis le panier (start_conversation_from_cart).
 * Le backend crée Order + OrderItems + Conversation + message automatique + notifications.
 */
export interface CreateOrderInput {
  items: Pick<CartItem, "productId" | "quantity">[];
  deliveryAddress?: string;
  deliveryQuarter?: string;
  deliveryCountry?: string;
  paymentMethod?: PaymentMethod;
  note?: string;
}

export type PaymentMethod = "OrangeMoney" | "AirtelMoney" | "M-Pesa" | "Cash";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "OrangeMoney", label: "Orange Money" },
  { value: "AirtelMoney", label: "Airtel Money" },
  { value: "M-Pesa", label: "M-Pesa" },
  { value: "Cash", label: "Cash à la livraison" },
];

export interface CreateOrderResult {
  order: Order;
  conversationId: number;
}
