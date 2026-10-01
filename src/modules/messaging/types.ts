/** shop.models.Conversation / Message / Notification */
export interface Participant {
  id: number;
  name: string;
  avatar: string | null;
  role: "client" | "revendeur" | "mukubwa" | "admin";
}

export interface Message {
  id: number;
  conversationId: number;
  sender: Participant;
  content: string | null;
  image: string | null;
  /** ex: { generatedFromCart: true } */
  metadata?: Record<string, unknown> | null;
  timestamp: string;
  seen: boolean;
}

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
  /** Discussion clôturée par l'admin (conclure_discussion) */
  concluded?: boolean;
}

export interface SendMessageInput {
  content?: string;
  image?: File | null;
}

export type NotificationType = "order" | "chat";

export interface Notification {
  id: number;
  conversationId: number;
  title: string;
  body: string;
  type: NotificationType | null;
  isRead: boolean;
  createdAt: string;
  /** Commande déjà assignée à un revendeur */
  isOrderAssigned: boolean;
}
