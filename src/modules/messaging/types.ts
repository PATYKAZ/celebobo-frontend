import type { OrderStatus } from "@/modules/orders/types";

/** shop.models.Conversation / Message / Notification (+ v2 : présence, propositions de prix, notifications par utilisateur) */
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
  status: "pending" | "accepted" | "refused";
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
}

export const isPriceProposal = (m: Pick<Message, "metadata">): boolean => (m.metadata as { type?: string } | null | undefined)?.type === "price_proposal";
export const isSystemMessage = (m: Pick<Message, "metadata">) => (m.metadata as { type?: string } | null | undefined)?.type === "system";

export interface Conversation {
  id: number;
  createdAt: string;
  isFromCart: boolean;
  relatedOrderId: number | null;
  /** "Discussion exclusivement sur la commande #12" / "Discussion #5 avec agent" */
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

export interface SendMessageInput {
  content?: string;
  image?: File | null;
}

export interface PriceProposalInput {
  itemId: number;
  newPrice: number;
  reason?: string;
}

export type NotificationType = "order" | "chat";

export interface Notification {
  id: number;
  /** Destinataire : id utilisateur ; 0 = boîte commune des responsables */
  userId: number;
  conversationId: number;
  title: string;
  body: string;
  type: NotificationType | null;
  isRead: boolean;
  createdAt: string;
  /** Commande déjà assignée à un revendeur */
  isOrderAssigned: boolean;
}

/** Filtres de la boîte de réception (côté UI). */
export type InboxFilter = "all" | "unassigned" | "awaiting";

/** Canal temps réel global de la messagerie (mock) ; en API : `user:{id}` / `conversation:{id}`. */
export const MESSAGING_CHANNEL = "messaging";
export type MessagingEvent = { type: "message" | "seen" | "conversation"; conversationId: number };
