import type { OrderStatus } from "@/modules/orders/types";

/** Discussions (commande / support), messages, propositions de prix et notifications — API `/conversations/`, `/notifications/`. */
export type Availability = "online" | "away" | "offline";

export interface Participant {
  id: number;
  name: string;
  avatar: string | null;
  /** "system" = messages automatiques (« Prix mis à jour »…) */
  role: "client" | "revendeur" | "mukubwa" | "admin" | "system";
  /** Présence (revendeurs ; l'équipe sans valeur est considérée en ligne) */
  availability?: Availability;
}

/** Proposition de prix final d'un revendeur (metadata.type === "price_proposal"). */
export interface PriceProposalMeta {
  type: "price_proposal";
  proposalId: number;
  orderId: number;
  itemId: number;
  productName: string;
  quantity: number;
  oldPrice: number;
  newPrice: number;
  reason: string | null;
  /** superseded : remplacée par une proposition plus récente sur le même article */
  status: "pending" | "accepted" | "refused" | "superseded";
}

export interface SystemMeta {
  type: "system";
}

export interface Message {
  id: number;
  conversationId: number;
  sender: Participant;
  content: string | null;
  image: string | null;
  /** ex: { generatedFromCart: true } | PriceProposalMeta | SystemMeta */
  metadata?: Record<string, unknown> | null;
  timestamp: string;
  /** vu par au moins un autre participant (coches « lu ») */
  seen: boolean;
  /** Identifiant d'envoi côté client (idempotence + remplacement du message optimiste) */
  clientMsgId?: string;
}

export const isPriceProposal = (m: Pick<Message, "metadata">): boolean => (m.metadata as { type?: string } | null | undefined)?.type === "price_proposal";
export const isSystemMessage = (m: Pick<Message, "metadata">) => (m.metadata as { type?: string } | null | undefined)?.type === "system";

export type ConversationKind = "order" | "support";

export interface Conversation {
  id: number;
  createdAt: string;
  kind: ConversationKind;
  isFromCart: boolean;
  relatedOrderId: number | null;
  /** Numéro public de la commande liée (CB-XXXX-XXXX) */
  orderNumber: string | null;
  subject: string;
  /** "Commande CB-…" / sujet de la discussion de support */
  displayName: string;
  participants: Participant[];
  lastMessage: Pick<Message, "content" | "timestamp" | "sender" | "image"> | null;
  unreadCount: number;
  /** Discussion clôturée (commande livrée / annulée / retournée, ou conclusion manuelle) */
  concluded?: boolean;
  /** Revendeur chargé de la commande / discussion (null = non assignée) */
  assignedRevendeur?: { id: number; name: string; availability?: Availability } | null;
  /** Dernier message envoyé par le client et sans réponse de l'équipe */
  awaitingReply?: boolean;
  orderStatus?: OrderStatus | null;
  /** Client concerné */
  client?: { id: number; name: string } | null;
}

/** Commande liée à une discussion (statut, lignes ajustables, présence du revendeur). */
export interface ConversationOrder {
  id: number;
  number: string;
  status: OrderStatus;
  totalPrice: number;
  items: { id: number; productName: string; variantLabel: string; quantity: number; unitPrice: number }[];
  resellerAvailability?: Availability;
}

export interface SendMessageInput {
  content?: string;
  image?: File | null;
}

export interface PriceProposalInput {
  itemId: number;
  newPrice: number;
  reason?: string;
}

export interface NewSupportInput {
  subject?: string;
  message: string;
}

export type NotificationType = "order" | "chat";

export type NotificationKind =
  | "order_placed"
  | "order_assigned"
  | "assignment_declined"
  | "order_status"
  | "new_message"
  | "support_request"
  | "conversation_assigned"
  | "price_proposed"
  | "price_answered";

export interface Notification {
  id: number;
  kind: NotificationKind;
  /** Lien front (ex. /messages/12, /admin/commandes/4, /compte/commandes/CB-…) */
  link: string;
  conversationId: number | null;
  orderId: number | null;
  title: string;
  body: string;
  type: NotificationType | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCounts {
  notifications: number;
  /** Discussions comportant des messages non lus */
  conversations: number;
}

/** Filtres de la boîte de réception (côté UI). */
export type InboxFilter = "all" | "unassigned" | "awaiting";

/** Canal temps réel global de la messagerie : toute discussion visible (nouveau message, lu, mise à jour). */
export const MESSAGING_CHANNEL = "messaging";
export type MessagingEvent = { type: "message" | "seen" | "conversation"; conversationId: number };
