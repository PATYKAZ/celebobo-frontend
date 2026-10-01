import { MOCK_ORDERS, MOCK_RESELLERS_LITE } from "@/modules/orders/mocks/orders";
import type { Order } from "@/modules/orders/types";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { Conversation, Message, Notification, Participant } from "../types";

/**
 * Store en mémoire du mode mock. Les conversations 1..8 correspondent aux commandes MOCK_ORDERS ;
 * tout autre id demandé est généré à la volée (checkout redirige vers /messages/<id> juste après création).
 */
const iso = (minAgo: number) => new Date(Date.now() - minAgo * 60000).toISOString();

export const MUKUBWA: Participant = { id: 3, name: "Joël Tshimanga", avatar: "/images/avatars/avatar-3.jpg", role: "mukubwa" };
const RESELLER_AVATARS: Record<number, string | null> = { 2: "/images/avatars/avatar-1.jpg", 5: "/images/avatars/avatar-2.jpg" };

const FALLBACK_CLIENT: Participant = { id: 1, name: "Aline Mbuyi", avatar: "/images/avatars/avatar-2.jpg", role: "client" };

export function currentParticipant(): Participant {
  const u = useAuthStore.getState().user;
  if (!u) return FALLBACK_CLIENT;
  return { id: u.id, name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username, avatar: u.avatar, role: u.role };
}

let msgSeq = 5000;
let notifSeq = 9000;
export const nextMessageId = () => ++msgSeq;

const conversations = new Map<number, Conversation>();
const messages = new Map<number, Message[]>();
const notifications: Notification[] = [];

const fmt = (n: number) => `$${n.toFixed(2)}`;

function cartText(order: Order): string {
  const lines = order.items.map((i) => `- ${i.productName} × ${i.quantity} = ${fmt(i.unitPrice * i.quantity)}`);
  return `Bonjour, je voudrais passer cette commande :\n\n${lines.join("\n")}\n\nTotal : ${fmt(order.totalPrice)}`;
}

function resellerParticipant(order: Order): Participant | null {
  if (!order.assignedRevendeur) return null;
  const r = MOCK_RESELLERS_LITE.find((x) => x.id === order.assignedRevendeur!.id);
  return { id: order.assignedRevendeur.id, name: r?.name ?? order.assignedRevendeur.name, avatar: RESELLER_AVATARS[order.assignedRevendeur.id] ?? null, role: "revendeur" };
}

function buildFromOrder(order: Order, buyerOverride?: Participant, fresh = false): void {
  const buyer: Participant = buyerOverride ?? { id: order.user.id, name: order.user.name, avatar: order.user.id === 1 ? "/images/avatars/avatar-2.jpg" : null, role: "client" };
  const reseller = resellerParticipant(order);
  const base = Math.max(10, Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000));
  const list: Message[] = [
    { id: nextMessageId(), conversationId: order.id, sender: buyer, content: cartText(order), image: null, metadata: { generatedFromCart: true, orderId: order.id }, timestamp: new Date(new Date(order.createdAt).getTime()).toISOString(), seen: true },
  ];
  if (!fresh) {
    list.push({ id: nextMessageId(), conversationId: order.id, sender: MUKUBWA, content: `Bonjour ${buyer.name.split(" ")[0]}, merci pour votre commande n°${order.id}. Nous vérifions la disponibilité et revenons vers vous très vite.`, image: null, timestamp: iso(base - 6), seen: true });
    if (reseller) {
      list.push({ id: nextMessageId(), conversationId: order.id, sender: reseller, content: "Bonjour ! Je suis votre revendeur pour cette commande. Quel mode de paiement préférez-vous : Orange Money, Airtel Money, M-Pesa ou cash à la livraison ?", image: null, timestamp: iso(Math.max(4, base - 30)), seen: order.status === "terminé" });
      if (order.status === "terminé") {
        list.push({ id: nextMessageId(), conversationId: order.id, sender: buyer, content: "Orange Money, je vous envoie le paiement maintenant.", image: null, timestamp: iso(Math.max(3, base - 45)), seen: true });
        list.push({ id: nextMessageId(), conversationId: order.id, sender: reseller, content: "Paiement bien reçu, merci ! Votre commande a été livrée. À bientôt chez Celebobo 🙌", image: null, timestamp: iso(Math.max(2, base - 90)), seen: true });
      }
    }
  }
  messages.set(order.id, list);
  conversations.set(order.id, {
    id: order.id,
    createdAt: order.createdAt,
    isFromCart: true,
    relatedOrderId: order.id,
    displayName: `Discussion exclusivement sur la commande #${order.id}`,
    participants: [buyer, MUKUBWA, ...(reseller ? [reseller] : [])],
    lastMessage: null,
    unreadCount: 0,
    concluded: order.status === "terminé",
  });
}

function seed() {
  if (conversations.size) return;
  MOCK_ORDERS.forEach((o) => buildFromOrder(o));
  // Notifications staff
  MOCK_ORDERS.forEach((o) => {
    notifications.push({
      id: ++notifSeq,
      conversationId: o.id,
      title: "Nouvelle commande",
      body: `${o.user.name} a envoyé une demande d'achat.`,
      type: "order",
      isRead: o.status === "terminé",
      createdAt: o.createdAt,
      isOrderAssigned: !!o.assignedRevendeur,
    });
  });
  notifications.push(
    { id: ++notifSeq, conversationId: 3, title: "Nouveau message", body: "Chancelle Bakole : « Est-ce disponible en noir ? »", type: "chat", isRead: false, createdAt: iso(25), isOrderAssigned: false },
    { id: ++notifSeq, conversationId: 4, title: "Assignation de commande", body: "Vous avez été assigné à la commande #4", type: "order", isRead: true, createdAt: iso(60 * 50), isOrderAssigned: true },
  );
  // Marque quelques messages non lus pour la démo
  const c2 = messages.get(2);
  c2?.forEach((m) => { if (m.sender.id !== 1 && m === c2[c2.length - 1]) m.seen = false; });
  const c6 = messages.get(6);
  c6?.forEach((m) => { if (m.sender.id !== 1) m.seen = false; });
}

/** Garantit l'existence d'une conversation (génère à la volée un id inconnu). */
export function ensureConversation(id: number): Conversation {
  seed();
  if (!conversations.has(id)) {
    const known = MOCK_ORDERS.find((o) => o.id === id);
    const buyer = currentParticipant();
    if (known) buildFromOrder(known);
    else {
      const o: Order = {
        id,
        createdAt: iso(1),
        status: "attente",
        totalPrice: 0,
        items: [],
        user: { id: buyer.id, name: buyer.name },
        assignedRevendeur: null,
        conversationId: id,
      };
      const recent = MOCK_ORDERS.find((x) => x.id === 3) ?? MOCK_ORDERS[0];
      o.items = recent.items;
      o.totalPrice = recent.totalPrice;
      buildFromOrder(o, buyer, true);
      notifications.unshift({ id: ++notifSeq, conversationId: id, title: "Nouvelle commande", body: `${buyer.name} a envoyé une demande d'achat.`, type: "order", isRead: false, createdAt: iso(1), isOrderAssigned: false });
      // réponse automatique du responsable
      setTimeout(() => pushAgentReply(id, `Bonjour ${buyer.name.split(" ")[0]}, nous avons bien reçu votre commande n°${id}. Un revendeur va prendre le relais d'ici quelques minutes.`), 3000);
    }
  }
  return decorate(conversations.get(id)!);
}

export function createSupportConversation(): Conversation {
  seed();
  const id = Math.max(100, ...conversations.keys()) + 1;
  const me = currentParticipant();
  conversations.set(id, {
    id,
    createdAt: iso(0),
    isFromCart: false,
    relatedOrderId: null,
    displayName: `Discussion #${id} avec agent`,
    participants: [me, MUKUBWA],
    lastMessage: null,
    unreadCount: 0,
  });
  messages.set(id, [
    { id: nextMessageId(), conversationId: id, sender: MUKUBWA, content: `Bonjour ${me.name.split(" ")[0]} 👋 Comment puis-je vous aider aujourd'hui ?`, image: null, timestamp: iso(0), seen: false },
  ]);
  return decorate(conversations.get(id)!);
}

function decorate(c: Conversation): Conversation {
  const list = messages.get(c.id) ?? [];
  const last = list[list.length - 1];
  const me = currentParticipant();
  return {
    ...c,
    lastMessage: last ? { content: last.content, timestamp: last.timestamp, sender: last.sender, image: last.image } : null,
    unreadCount: list.filter((m) => m.sender.id !== me.id && !m.seen).length,
  };
}

export function listConversations(): Conversation[] {
  seed();
  const me = currentParticipant();
  const isStaff = me.role !== "client";
  // Conversations lazily créées pour l'utilisateur courant incluses
  return [...conversations.values()]
    .filter((c) => isStaff || c.participants[0]?.id === me.id)
    .map(decorate)
    .sort((a, b) => +new Date(b.lastMessage?.timestamp ?? b.createdAt) - +new Date(a.lastMessage?.timestamp ?? a.createdAt));
}

export function getMessages(id: number, after?: number): Message[] {
  ensureConversation(id);
  const me = currentParticipant();
  const list = messages.get(id)!;
  list.forEach((m) => { if (m.sender.id !== me.id) m.seen = true; });
  return after ? list.filter((m) => m.id > after) : [...list];
}

export function appendMessage(id: number, content: string | null, image: string | null): Message {
  ensureConversation(id);
  const me = currentParticipant();
  const msg: Message = { id: nextMessageId(), conversationId: id, sender: me, content, image, timestamp: new Date().toISOString(), seen: false };
  messages.get(id)!.push(msg);
  if (me.role === "client") {
    const conv = conversations.get(id)!;
    const agent = conv.participants.find((p) => p.role === "revendeur") ?? conv.participants.find((p) => p.role === "mukubwa") ?? MUKUBWA;
    const replies = [
      "Bien reçu, je regarde cela tout de suite.",
      "Merci pour l'information ! Je vous confirme la disponibilité dans quelques instants.",
      "Parfait. Pour le paiement, vous pouvez utiliser Orange Money, Airtel Money, M-Pesa ou régler en cash à la livraison.",
    ];
    const text = image && !content ? "Merci pour la photo, c'est bien noté 👍" : replies[Math.floor(Math.random() * replies.length)];
    setTimeout(() => pushAgentReply(id, text, agent), 2200 + Math.random() * 900);
  }
  return msg;
}

function pushAgentReply(id: number, text: string, agent: Participant = MUKUBWA) {
  const list = messages.get(id);
  if (!list) return;
  list.push({ id: nextMessageId(), conversationId: id, sender: agent, content: text, image: null, timestamp: new Date().toISOString(), seen: false });
}

export function concludeConversation(id: number) {
  const c = conversations.get(id);
  if (c) c.concluded = true;
}

// ---- Notifications ------------------------------------------------------
export function listNotifications(): Notification[] {
  ensureConversation(1);
  return [...notifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function patchNotification(id: number, patch: Partial<Notification>) {
  const n = notifications.find((x) => x.id === id);
  if (n) Object.assign(n, patch);
  return n;
}

export function assignOrderToReseller(notificationId: number, resellerId: number) {
  const n = notifications.find((x) => x.id === notificationId);
  if (!n) return;
  const reseller = MOCK_RESELLERS_LITE.find((r) => r.id === resellerId);
  if (!reseller) return;
  ensureConversation(n.conversationId);
  const conv = conversations.get(n.conversationId)!;
  const part: Participant = { id: reseller.id, name: reseller.name, avatar: RESELLER_AVATARS[reseller.id] ?? null, role: "revendeur" };
  if (!conv.participants.some((p) => p.id === part.id)) conv.participants.push(part);
  const order = MOCK_ORDERS.find((o) => o.id === conv.relatedOrderId);
  if (order) {
    order.assignedRevendeur = { id: reseller.id, name: reseller.name };
    if (order.status === "attente") order.status = "traitement";
  }
  notifications.filter((x) => x.conversationId === n.conversationId && x.type === "order").forEach((x) => { x.isOrderAssigned = true; x.isRead = true; });
  notifications.unshift({ id: ++notifSeq, conversationId: n.conversationId, title: "Assignation de commande", body: `${reseller.name} a été assigné à la commande #${conv.relatedOrderId ?? n.conversationId}`, type: "order", isRead: false, createdAt: new Date().toISOString(), isOrderAssigned: true });
}

export const MOCK_RESELLER_OPTIONS = MOCK_RESELLERS_LITE;
