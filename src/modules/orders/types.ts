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

/** Annulable par le client, sans frais, jusqu'au départ en livraison (remboursée si déjà payée). */
export const isCancellableByClient = (s: OrderStatus) => s === "attente" || s === "assignee" || s === "confirmee" || s === "payee";

/** Mapping de l'ancien backend. */
export const fromLegacyStatus = (s: string): OrderStatus =>
  s === "traitement" ? "assignee" : s === "terminé" ? "livree" : (s as OrderStatus);
export const toLegacyStatus = (s: OrderStatus): "attente" | "traitement" | "terminé" =>
  s === "attente" ? "attente" : s === "livree" || s === "annulee" || s === "retournee" ? "terminé" : "traitement";

export interface OrderItem {
  id: number;
  productId: number | null;
  /** Lien vers la fiche produit (absent si le produit a été retiré du catalogue). */
  productSlug?: string | null;
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

/** Adresse de livraison figée sur la commande. */
export interface OrderAddress {
  recipient: string;
  phone: string;
  line1: string;
  quarter: string;
  city: string;
  country: string;
}

export type ResellerAvailability = "online" | "away" | "offline";

export interface Order {
  id: number;
  /** Numéro public (ex: CB-7KQ2-M9XA) : identifiant des URLs client, du suivi et des notifications. */
  number?: string;
  createdAt: string;
  status: OrderStatus;
  totalPrice: number;
  items: OrderItem[];
  user: { id: number; name: string; email?: string; phone?: string | null };
  assignedRevendeur: { id: number; name: string; availability?: ResellerAvailability | null } | null;
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
  /** Nombre d'articles (listes : les lignes ne sont détaillées que sur la fiche). */
  itemsCount?: number;
  previewName?: string | null;
  previewImage?: string | null;
  subtotal?: number;
  /** Remise du code promo */
  discount?: number;
  couponCode?: string | null;
  /** Points de fidélité utilisés sur la commande (1 point = 1 $) */
  points?: number;
  /** Points de fidélité gagnés une fois la commande livrée (null : rien, ou pas encore) */
  pointsEarned?: number | null;
  shippingFee?: number;
  shippingZone?: string | null;
  /** Retrait en boutique (sinon livraison) */
  pickup?: boolean;
  /** Adresse du point de retrait */
  pickupAddress?: string | null;
  /** Délai indicatif (zone, ou devis accepté) */
  deliveryEstimate?: string | null;
  /** Zone sur devis : frais de livraison pas encore acceptés par le client */
  awaitingShippingQuote?: boolean;
  /** Annulée après paiement : « due » tant que le remboursement n'est pas enregistré, puis « done » */
  refundStatus?: "due" | "done" | null;
  /** Montant à rendre au client */
  refundDue?: number;
  refundedAt?: string | null;
  /** Ex. référence de la transaction Mobile Money */
  refundNote?: string | null;
  /** Client uniquement : code à donner au revendeur à la remise (de la confirmation à la livraison) */
  deliveryCode?: string | null;
  /** Back-office : codes incorrects saisis, et code bloqué après 5 erreurs */
  deliveryCodeAttempts?: number;
  deliveryCodeLocked?: boolean;
  /** Note donnée par le client au revendeur après la livraison */
  rating?: { score: number; comment: string; createdAt: string } | null;
  /** Le client peut encore noter le revendeur (livrée, pas encore notée) */
  canRate?: boolean;
  /** Tentatives de livraison échouées (2 jours ouvrables d'échecs annulent la commande) */
  deliveryAttempts?: DeliveryAttempt[];
  /** Code du motif d'annulation (ex. « delivery_failed ») ; `cancelReason` en est le libellé */
  cancelReasonCode?: string | null;
  address?: OrderAddress | null;
  /** Transitions permises à l'utilisateur courant (ex: `annulee` pour le client tant qu'elle est en attente). */
  allowedTransitions?: OrderStatus[];
}

/** Libellé des frais de livraison d'une commande : sur devis, retrait gratuit, offerte ou montant. */
export function shippingFeeLabel(o: Pick<Order, "shippingFee" | "awaitingShippingQuote" | "pickup">, format: (n: number) => string): string {
  if (o.awaitingShippingQuote) return "Sur devis";
  if (o.pickup) return "Gratuit (retrait)";
  return o.shippingFee ? format(o.shippingFee) : "Offerte";
}

export interface DeliveryAttempt {
  at: string;
  reason: AttemptReason;
  reasonLabel: string;
  note: string;
}

export type AttemptReason = "client_absent" | "unreachable" | "wrong_address" | "refused" | "other";

export const ATTEMPT_REASONS: { value: AttemptReason; label: string }[] = [
  { value: "client_absent", label: "Client absent" },
  { value: "unreachable", label: "Client injoignable" },
  { value: "wrong_address", label: "Adresse introuvable ou erronée" },
  { value: "refused", label: "Colis refusé" },
  { value: "other", label: "Autre" },
];

/** Motifs posés par le système (jamais choisis par le client). */
export const SYSTEM_CANCEL_LABEL: Record<string, string> = {
  expired: "Aucun revendeur assigné à temps",
  delivery_failed: "Livraison impossible après deux jours de tentatives",
};

/** Motifs d'annulation (client). */
export type CancelReason = "changed_mind" | "cheaper_elsewhere" | "too_slow" | "ordered_by_mistake" | "other";

export const CANCEL_REASONS: { value: CancelReason; label: string }[] = [
  { value: "changed_mind", label: "Changement d'avis" },
  { value: "cheaper_elsewhere", label: "Prix trouvé moins cher ailleurs" },
  { value: "too_slow", label: "Délai trop long" },
  { value: "ordered_by_mistake", label: "Commande passée par erreur" },
  { value: "other", label: "Autre" },
];

export interface CancelOrderInput {
  reason: CancelReason;
  details?: string;
}

export interface OrderListParams {
  status?: OrderStatus | "all";
  page?: number;
  pageSize?: number;
}

/**
 * Création d'une commande depuis le panier : le backend crée Order + lignes + discussion + notifications
 * et vide le panier serveur.
 */
export interface CreateOrderInput {
  items: (Pick<CartItem, "productId" | "quantity"> & { variantId?: number | null })[];
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  /** Points de fidélité à utiliser (1 point = 1 $) ; 409 `points_unavailable` si le solde ne suffit plus */
  points?: number;
  /** Adresse du carnet d'adresses choisie */
  addressId?: number | null;
  /** Nouvelle adresse saisie (si pas d'adresse du carnet) */
  address?: OrderAddress | null;
  note?: string;
  /** Retrait en boutique */
  pickup?: boolean;
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
  conversationId: number | null;
}
