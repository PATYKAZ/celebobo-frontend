import { ROLE_FROM_API } from "@/modules/auth/services/auth.mapper";
import type { OrderStatus } from "@/modules/orders/types";
import { money } from "@/modules/products/services/products.mapper";
import type { Availability, Conversation, ConversationOrder, Message, Notification, NotificationKind, Participant, PriceProposalMeta } from "../types";

/** Interlocuteur (après camelCase). */
export interface ParticipantDto {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

export interface MessageDto {
  id: number;
  conversationId: number;
  kind: "text" | "system" | "price_proposal";
  body: string;
  attachment: string;
  metadata: Record<string, unknown>;
  sender: ParticipantDto | null;
  clientMsgId: string;
  createdAt: string;
}

export interface ConversationDto {
  id: number;
  kind: "order" | "support";
  status: "open" | "closed";
  subject: string;
  orderId: number | null;
  orderNumber: string | null;
  client: ParticipantDto;
  reseller: ParticipantDto | null;
  lastMessage: MessageDto | null;
  unreadCount: number;
  createdAt: string;
  lastMessageAt: string | null;
}

export interface MessagePageDto {
  results: MessageDto[];
  meta: { nextBefore: number | null };
}

export interface NotificationDto {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  conversationId: number | null;
  orderId: number | null;
  createdAt: string;
}

/** Commande vue depuis la discussion (`/me/orders/{number}/` côté client, `/bo/orders/{id}/` côté équipe). */
export interface OrderDto {
  id: number;
  number: string;
  status: string;
  total: string;
  items: { id: number; name: string; variantLabel: string; quantity: number; unitPrice: string }[];
  reseller: { id: number; name: string; availability: Availability | null } | null;
}

export const ORDER_STATUS_FROM_API: Record<string, OrderStatus> = {
  pending: "attente",
  assigned: "assignee",
  confirmed: "confirmee",
  paid: "payee",
  shipping: "en_livraison",
  delivered: "livree",
  cancelled: "annulee",
  returned: "retournee",
};

const SYSTEM: Participant = { id: 0, name: "Celebobo", avatar: null, role: "system" };

export function toParticipant(dto: ParticipantDto): Participant {
  return { id: dto.id, name: dto.name, avatar: dto.avatar || null, role: ROLE_FROM_API[dto.role as keyof typeof ROLE_FROM_API] ?? "client" };
}

function toProposal(meta: Record<string, unknown>): PriceProposalMeta {
  return {
    type: "price_proposal",
    proposalId: Number(meta.proposalId),
    orderId: Number(meta.orderId),
    itemId: Number(meta.itemId),
    productName: String(meta.productName ?? ""),
    quantity: Number(meta.quantity ?? 1),
    oldPrice: money(meta.previousPrice as string),
    newPrice: money(meta.proposedPrice as string),
    reason: (meta.reason as string) || null,
    status: (meta.status as PriceProposalMeta["status"]) ?? "pending",
  };
}

export function toMessage(dto: MessageDto): Message {
  const metadata = dto.kind === "price_proposal" ? { ...toProposal(dto.metadata) } : dto.kind === "system" ? { ...dto.metadata, type: "system" } : dto.metadata;
  return {
    id: dto.id,
    conversationId: dto.conversationId,
    sender: dto.sender ? toParticipant(dto.sender) : SYSTEM,
    content: dto.body || null,
    image: dto.attachment || null,
    metadata,
    timestamp: dto.createdAt,
    seen: false,
    clientMsgId: dto.clientMsgId || undefined,
  };
}

export function toConversation(dto: ConversationDto): Conversation {
  const client = toParticipant(dto.client);
  const reseller = dto.reseller ? toParticipant(dto.reseller) : null;
  const last = dto.lastMessage ? toMessage(dto.lastMessage) : null;
  return {
    id: dto.id,
    createdAt: dto.createdAt,
    kind: dto.kind,
    isFromCart: dto.kind === "order",
    relatedOrderId: dto.orderId,
    orderNumber: dto.orderNumber,
    subject: dto.subject,
    displayName: dto.kind === "order" && dto.orderNumber ? `Commande ${dto.orderNumber}` : dto.subject || `Discussion #${dto.id}`,
    participants: reseller ? [client, reseller] : [client],
    lastMessage: last && { content: dto.lastMessage?.kind === "price_proposal" ? "Proposition de prix" : last.content, timestamp: last.timestamp, sender: last.sender, image: last.image },
    unreadCount: dto.unreadCount,
    concluded: dto.status === "closed",
    assignedRevendeur: reseller && { id: reseller.id, name: reseller.name },
    awaitingReply: dto.status === "open" && last?.sender.id === client.id,
    orderStatus: null,
    client: { id: client.id, name: client.name },
  };
}

export function toNotification(dto: NotificationDto): Notification {
  return {
    id: dto.id,
    kind: dto.kind,
    link: dto.link,
    conversationId: dto.conversationId,
    orderId: dto.orderId,
    title: dto.title,
    body: dto.body,
    type: dto.conversationId ? "chat" : "order",
    isRead: dto.isRead,
    createdAt: dto.createdAt,
  };
}

export function toConversationOrder(dto: OrderDto): ConversationOrder {
  return {
    id: dto.id,
    number: dto.number,
    status: ORDER_STATUS_FROM_API[dto.status] ?? "attente",
    totalPrice: money(dto.total),
    items: dto.items.map((i) => ({ id: i.id, productName: i.name, variantLabel: i.variantLabel, quantity: i.quantity, unitPrice: money(i.unitPrice) })),
    resellerAvailability: dto.reseller?.availability ?? undefined,
  };
}
