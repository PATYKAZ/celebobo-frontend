import type { CartItem } from "@/modules/cart/types";

/**
 * Cycle de vie d'une commande (v2).
 *   attente → assignee → confirmee → payee → en_livraison → livree     (+ annulee | retournee)
 *
 * Compat API v1 (Order.status ∈ attente|traitement|terminé) : voir `fromLegacyStatus`.
 */
export type OrderStatus = "attente" | "assignee" | "confirmee" | "payee" | "en_livraison" | "livree" | "annulee" | "retournee";

/** Étapes « normales » dans l'ordre. */
export const ORDER_FLOW: OrderStatus[] = ["attente", "assignee", "confirmee", "payee", "en_livraison", "livree"];
export const ORDER_FINAL: OrderStatus[] = ["livree", "annulee", "retournee"];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  attente: "En attente",
  assignee: "Assignée",
  confirmee: "Confirmée",
  payee: "Payée",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
  retournee: "Retournée",
};

/** Ton visuel (StatusDot) par statut. */
export const ORDER_STATUS_TONE: Record<OrderStatus, "green" | "orange" | "red" | "gray" | "blue"> = {
  attente: "orange",
  assignee: "blue",
  confirmee: "blue",
  payee: "green",
  en_livraison: "blue",
  livree: "green",
  annulee: "red",
  retournee: "gray",
};

/** Prochaine étape normale (null si finale). */
export const nextOrderStatus = (s: OrderStatus): OrderStatus | null => {
  const i = ORDER_FLOW.indexOf(s);
  return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : null;
};

/** Annulable par le client uniquement tant qu'elle est en attente. */
export const isCancellableByClient = (s: OrderStatus) => s === "attente";

/** Mapping de l'ancien backend. */
export const fromLegacyStatus = (s: string): OrderStatus =>
  s === "traitement" ? "assignee" : s === "terminé" ? "livree" : (s as OrderStatus);
export const toLegacyStatus = (s: OrderStatus): "attente" | "traitement" | "terminé" =>
  s === "attente" ? "attente" : s === "livree" || s === "annulee" || s === "retournee" ? "terminé" : "traitement";

export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  /** Variante choisie (ex: "Noir / 256 Go") */
  variantLabel?: string | null;
}

/** Entrée d'historique de statut (qui, quand). */
export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  by: { id: number; name: string; role: "client" | "revendeur" | "mukubwa" | "admin" | "system" };
  note?: string | null;
}

export interface Order {
  id: number;
  createdAt: string;
  status: OrderStatus;
  totalPrice: number;
  items: OrderItem[];
  user: { id: number; name: string; email?: string; phone?: string | null };
  assignedRevendeur: { id: number; name: string } | null;
  /** Discussion liée (conversation créée à la commande). */
  conversationId: number | null;
  statusHistory: OrderStatusEvent[];
  deliveryAddress: string | null;
  paymentMethod: PaymentMethod | null;
  /** Note du client à la commande */
  note: string | null;
  /** true dès que la commande a été convertie en ventes (bloque une 2ᵉ conversion) */
  convertedToSales: boolean;
  cancelReason?: string | null;
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
  items: (Pick<CartItem, "productId" | "quantity"> & { variantId?: number | null })[];
  deliveryAddress?: string;
  deliveryQuarter?: string;
  deliveryCountry?: string;
  paymentMethod?: PaymentMethod;
  note?: string;
  /** Adresse du carnet d'adresses choisie */
  addressId?: number | null;
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
