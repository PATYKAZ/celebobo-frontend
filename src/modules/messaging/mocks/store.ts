import { can } from "@/modules/auth/permissions";
import { ORDER_FINAL, ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/modules/orders/types";
import { ApiError } from "@/shared/lib/api/errors";
import { channels, realtime, type ConversationEvent, type PresenceEvent, type UserEvent } from "@/shared/lib/realtime";
import { DB, fullName, resellers, userById, type DbUser } from "@/shared/mock-db";
import { actorName, getActor } from "@/shared/mock-db/selectors";
import {
  MESSAGING_CHANNEL,
  type Availability,
  type Conversation,
  type Message,
  type MessagingEvent,
  type Participant,
  type PriceProposalInput,
  type PriceProposalMeta,
} from "../types";

/**
 * Store en mémoire du mode mock — dérivé de la base unique `shared/mock-db`.
 *  - Une conversation par commande (id = id de commande) + discussions de support (ids ≥ 7000).
 *  - Visibilité par rôle : client = les siennes ; revendeur = participant OU commande assignée ; responsable/admin = toutes.
 *  - « Lu » est suivi PAR UTILISATEUR (seenBy) → les compteurs de non-lus sont corrects pour chaque rôle.
 *  - Toute mutation émet un événement temps réel (canal `conversation:{id}`, `user:{id}`, `messaging`).
 */

/** Notification du mode mock (ancienne forme : boîte commune des responsables = userId 0). */
interface Notification {
  id: number;
  userId: number;
  conversationId: number;
  title: string;
  body: string;
  type: "order" | "chat" | null;
  isRead: boolean;
  createdAt: string;
  isOrderAssigned: boolean;
}

const MIN = 60000;
const iso = (ms: number) => new Date(Math.min(ms, Date.now() - MIN)).toISOString();

export const SYSTEM_PARTICIPANT: Participant = { id: 0, name: "Celebobo", avatar: null, role: "system" };
const MANAGER_ID = 3;

const isFinal = (s: OrderStatus) => ORDER_FINAL.includes(s);

// ───────────────────────────── Participants ─────────────────────────────
function participantOf(u: DbUser): Participant {
  const availability: Availability | undefined = u.role === "client" ? undefined : (u.availability ?? "online");
  return { id: u.id, name: fullName(u), avatar: u.avatar, role: u.role, availability };
}
const participantById = (id: number): Participant | null => {
  const u = userById(id);
  return u ? participantOf(u) : null;
};
export function currentParticipant(): Participant {
  const a = getActor();
  return participantById(a.id) ?? { id: a.id, name: actorName(a), avatar: null, role: a.role };
}
/** Snapshot sans présence (stocké dans les messages). */
const snap = (p: Participant): Participant => ({ ...p, availability: undefined });

// ───────────────────────────── État ─────────────────────────────
interface ConvRec {
  id: number;
  createdAt: string;
  orderId: number | null;
  buyerId: number;
  /** Utilisateurs ajoutés à la discussion (reply, assignation de discussion) */
  extra: number[];
  manualConcluded: boolean;
}

let msgSeq = 5000;
let notifSeq = 9000;
let proposalSeq = 1;
let supportSeq = 7000;
export const nextMessageId = () => ++msgSeq;

const convs = new Map<number, ConvRec>();
const msgs = new Map<number, Message[]>();
/** messageId → ids des utilisateurs qui l'ont vu */
const seenBy = new Map<number, Set<number>>();
const notifications: Notification[] = [];
let seeded = false;

const fmt = (n: number) => `$${n.toFixed(2)}`;
const markSeenBy = (m: Message, ...users: number[]) => {
  const s = seenBy.get(m.id) ?? new Set<number>();
  users.forEach((u) => s.add(u));
  seenBy.set(m.id, s);
};

function emitConv(conversationId: number, e: ConversationEvent) {
  realtime.emit(channels.conversation(conversationId), e);
}
function emitMessaging(type: MessagingEvent["type"], conversationId: number) {
  realtime.emit<MessagingEvent>(MESSAGING_CHANNEL, { type, conversationId });
}

// ───────────────────────────── Construction ─────────────────────────────
function cartText(order: Order): string {
  const lines = order.items.map((i) => `- ${i.productName} × ${i.quantity} = ${fmt(i.unitPrice * i.quantity)}`);
  return `Bonjour, je voudrais passer cette commande :\n\n${lines.join("\n")}\n\nTotal : ${fmt(order.totalPrice)}`;
}

function push(conversationId: number, sender: Participant, content: string | null, at: number, metadata: Record<string, unknown> | null = null, image: string | null = null): Message {
  const m: Message = { id: nextMessageId(), conversationId, sender: snap(sender), content, image, metadata, timestamp: iso(at), seen: false };
  const list = msgs.get(conversationId) ?? [];
  list.push(m);
  msgs.set(conversationId, list);
  return m;
}

/** Scénario de messages cohérent avec le statut de la commande. */
function buildFromOrder(order: Order, fresh = false) {
  const buyerU = userById(order.user.id);
  const buyer = buyerU ? participantOf(buyerU) : { id: order.user.id, name: order.user.name, avatar: null, role: "client" as const };
  const manager = participantById(MANAGER_ID)!;
  const reseller = order.assignedRevendeur ? participantById(order.assignedRevendeur.id) : null;
  const t0 = new Date(order.createdAt).getTime();
  convs.set(order.id, { id: order.id, createdAt: order.createdAt, orderId: order.id, buyerId: buyer.id, extra: [], manualConcluded: false });
  msgs.set(order.id, []);
  const sent: Message[] = [];
  let step = 0;
  const at = () => t0 + ++step * 41 * MIN;
  const say = (p: Participant, text: string, meta: Record<string, unknown> | null = null) => sent.push(push(order.id, p, text, at(), meta));

  sent.push(push(order.id, buyer, cartText(order), t0, { generatedFromCart: true, orderId: order.id }));
  if (fresh) {
    sent.forEach((m) => markSeenBy(m, buyer.id));
    return;
  }
  const s = order.status;
  const first = buyer.name.split(" ")[0];
  const idx = ["attente", "assignee", "confirmee", "payee", "en_livraison", "livree", "retournee"].indexOf(s);
  if (s !== "attente" || order.statusHistory.length > 1) say(manager, `Bonjour ${first}, merci pour votre commande n°${order.id}. Nous vérifions la disponibilité et revenons vers vous très vite.`);
  if (reseller && s !== "attente") {
    say(reseller, "Bonjour ! Je suis votre revendeur pour cette commande. Quel mode de paiement préférez-vous : Orange Money, Airtel Money, M-Pesa ou cash à la livraison ?");
    if (idx >= 2 || s === "annulee") say(buyer, s === "annulee" ? "Finalement je préfère annuler, merci." : "Orange Money, et livraison à l'adresse indiquée dans la commande.");
    if (idx >= 2) say(reseller, "Parfait, votre commande est confirmée. Je vous envoie les détails de paiement.");
    if (idx >= 3) say(buyer, "Paiement envoyé, merci !");
    if (idx >= 3) say(reseller, "Paiement bien reçu ✅ Je prépare l'expédition.");
    if (idx >= 4) say(reseller, "Votre colis est en route, le livreur vous appellera à l'arrivée.");
    if (idx >= 5) say(reseller, "Commande livrée. Merci de votre confiance, à bientôt chez Celebobo 🙌");
    if (s === "retournee") say(buyer, "Je dois retourner le produit, il ne correspond pas.");
  }
  if (isFinal(s)) push(order.id, SYSTEM_PARTICIPANT, `Commande ${ORDER_STATUS_LABEL[s].toLowerCase()} — discussion clôturée.`, at(), { type: "system" });
  // tout est lu par tout le monde, sauf cas de démo ci-dessous
  const everyone = [buyer.id, MANAGER_ID, 4, ...resellers().map((r) => r.id)];
  (msgs.get(order.id) ?? []).forEach((m) => markSeenBy(m, ...everyone));

  // Démo : relance du client non lue sur certaines commandes ouvertes
  if (!isFinal(s) && s !== "attente" && reseller && order.id % 3 !== 1) {
    const m = push(order.id, buyer, "Bonjour, avez-vous des nouvelles ? Je suis disponible toute la journée.", Date.now() - (6 + (order.id % 40)) * MIN);
    markSeenBy(m, buyer.id);
  }
  // Commandes en attente : le message de la commande n'est pas lu par l'équipe
  if (s === "attente") {
    const first0 = msgs.get(order.id)![0];
    seenBy.set(first0.id, new Set([buyer.id]));
  }
}

function notify(userIds: (number | "managers")[], n: Omit<Notification, "id" | "userId" | "createdAt" | "isRead"> & { isRead?: boolean; createdAt?: string }) {
  for (const u of userIds) {
    const userId = u === "managers" ? 0 : u;
    const notif: Notification = { id: ++notifSeq, userId, isRead: false, createdAt: new Date().toISOString(), ...n };
    notifications.unshift(notif);
    const targets = u === "managers" ? DB.users.filter((x) => x.role === "mukubwa" || x.role === "admin").map((x) => x.id) : [u];
    targets.forEach((id) => realtime.emit<UserEvent>(channels.user(id), { type: "notification", notificationId: notif.id }));
  }
}

function seed() {
  if (seeded) return;
  seeded = true;
  DB.orders.forEach((o) => buildFromOrder(o));

  for (const o of DB.orders) {
    notifications.push({ id: ++notifSeq, userId: 0, conversationId: o.id, title: "Nouvelle commande", body: `${o.user.name} a envoyé une demande d'achat.`, type: "order", isRead: o.status !== "attente", createdAt: o.createdAt, isOrderAssigned: !!o.assignedRevendeur });
    if (o.assignedRevendeur && ["assignee", "confirmee", "payee", "en_livraison"].includes(o.status)) {
      notifications.push({ id: ++notifSeq, userId: o.assignedRevendeur.id, conversationId: o.id, title: "Assignation de commande", body: `Vous avez été assigné à la commande #${o.id}`, type: "order", isRead: o.status !== "assignee", createdAt: o.statusHistory.find((h) => h.status === "assignee")?.at ?? o.createdAt, isOrderAssigned: true });
    }
  }
  // Notifications de messages non lus pour les revendeurs
  for (const [id, list] of msgs) {
    const o = DB.orders.find((x) => x.id === id);
    const last = list[list.length - 1];
    if (o?.assignedRevendeur && last?.sender.role === "client" && !isFinal(o.status) && !(seenBy.get(last.id)?.has(o.assignedRevendeur.id))) {
      notifications.push({ id: ++notifSeq, userId: o.assignedRevendeur.id, conversationId: id, title: "Nouveau message", body: `${last.sender.name} : « ${(last.content ?? "").slice(0, 60)} »`, type: "chat", isRead: false, createdAt: last.timestamp, isOrderAssigned: true });
    }
  }
  notifications.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  // Une assignation (workflow commandes) crée la notification du revendeur concerné
  resellers().forEach((r) => {
    realtime.subscribe<UserEvent>(channels.user(r.id), (e) => {
      if (e.type !== "assignment") return;
      const o = DB.orders.find((x) => x.id === e.orderId);
      if (!o) return;
      afterAssignment(o);
      notify([r.id], { conversationId: o.id, title: "Assignation de commande", body: `Vous avez été assigné à la commande #${o.id}`, type: "order", isOrderAssigned: true });
    });
  });
}
if (typeof window !== "undefined") seed();

// ───────────────────────────── Visibilité & décoration ─────────────────────────────
const orderOf = (c: ConvRec) => (c.orderId != null ? DB.orders.find((o) => o.id === c.orderId) ?? null : null);

function isVisible(c: ConvRec, actor = getActor()): boolean {
  if (actor.role === "client") return c.buyerId === actor.id;
  if (can(actor, "inbox.view.all")) return true;
  return c.extra.includes(actor.id) || orderOf(c)?.assignedRevendeur?.id === actor.id;
}

function assignedOf(c: ConvRec): { id: number; name: string; availability?: Availability } | null {
  const o = orderOf(c);
  const id = o ? o.assignedRevendeur?.id : c.extra.find((x) => userById(x)?.role === "revendeur");
  const u = id != null ? userById(id) : null;
  return u ? { id: u.id, name: fullName(u), availability: u.availability } : null;
}

function participantsOf(c: ConvRec): Participant[] {
  const ids = [c.buyerId, MANAGER_ID, assignedOf(c)?.id, ...c.extra].filter((x): x is number => x != null);
  return [...new Set(ids)].map(participantById).filter((p): p is Participant => !!p);
}

function decorate(c: ConvRec, actor = getActor()): Conversation {
  const list = msgs.get(c.id) ?? [];
  const last = list[list.length - 1];
  const o = orderOf(c);
  const concluded = c.manualConcluded || (o ? isFinal(o.status) : false);
  const buyer = userById(c.buyerId);
  const lastReal = [...list].reverse().find((m) => m.sender.role !== "system");
  return {
    id: c.id,
    createdAt: c.createdAt,
    kind: o ? "order" : "support",
    isFromCart: !!o,
    relatedOrderId: o?.id ?? null,
    orderNumber: o ? String(o.id) : null,
    subject: "",
    displayName: o ? `Discussion exclusivement sur la commande #${o.id}` : `Discussion #${c.id} avec agent`,
    participants: participantsOf(c),
    lastMessage: last ? { content: last.content, timestamp: last.timestamp, sender: last.sender, image: last.image } : null,
    unreadCount: list.filter((m) => m.sender.id !== actor.id && !seenBy.get(m.id)?.has(actor.id)).length,
    concluded,
    assignedRevendeur: assignedOf(c),
    awaitingReply: !concluded && lastReal?.sender.role === "client",
    orderStatus: o?.status ?? null,
    client: buyer ? { id: buyer.id, name: fullName(buyer) } : { id: c.buyerId, name: o?.user.name ?? "Client" },
  };
}

// ───────────────────────────── API conversations ─────────────────────────────
/** Garantit l'existence d'une conversation (génère à la volée un id inconnu pour un client). */
export function ensureConversation(id: number): Conversation {
  seed();
  const actor = getActor();
  if (!convs.has(id)) {
    const known = DB.orders.find((o) => o.id === id);
    if (known) {
      const fresh = Date.now() - new Date(known.createdAt).getTime() < 5 * MIN;
      buildFromOrder(known, fresh);
      if (fresh) {
        notify(["managers"], { conversationId: id, title: "Nouvelle commande", body: `${known.user.name} a envoyé une demande d'achat.`, type: "order", isOrderAssigned: false });
        setTimeout(() => agentSays(id, participantById(MANAGER_ID)!, `Bonjour ${known.user.name.split(" ")[0]}, nous avons bien reçu votre commande n°${id}. Un revendeur va prendre le relais d'ici quelques minutes.`), 3000);
      }
    } else if (actor.role === "client") {
      // Fallback : id inconnu (ex. redirection juste après le checkout) → conversation de commande générique
      const ref = DB.orders.find((o) => o.user.id === actor.id) ?? DB.orders[0];
      const o: Order = { ...ref, id, createdAt: new Date(Date.now() - MIN).toISOString(), status: "attente", assignedRevendeur: null, user: { id: actor.id, name: actorName(actor) }, statusHistory: [], conversationId: id };
      buildFromOrder(o, true);
    } else throw new ApiError(404, "Discussion introuvable");
  }
  const rec = convs.get(id)!;
  if (!isVisible(rec, actor)) throw new ApiError(403, "Vous n'avez pas accès à cette discussion.");
  return decorate(rec, actor);
}

export function createSupportConversation(): Conversation {
  seed();
  const me = currentParticipant();
  const id = ++supportSeq;
  convs.set(id, { id, createdAt: new Date().toISOString(), orderId: null, buyerId: me.id, extra: [], manualConcluded: false });
  msgs.set(id, []);
  const m = push(id, participantById(MANAGER_ID)!, `Bonjour ${me.name.split(" ")[0]} 👋 Comment puis-je vous aider aujourd'hui ?`, Date.now() - MIN);
  markSeenBy(m, MANAGER_ID);
  notify(["managers"], { conversationId: id, title: "Nouvelle discussion", body: `${me.name} a ouvert une discussion de support.`, type: "chat", isOrderAssigned: false });
  return decorate(convs.get(id)!);
}

export function listConversations(): Conversation[] {
  seed();
  const actor = getActor();
  return [...convs.values()]
    .filter((c) => isVisible(c, actor))
    .map((c) => decorate(c, actor))
    .sort((a, b) => +new Date(b.lastMessage?.timestamp ?? b.createdAt) - +new Date(a.lastMessage?.timestamp ?? a.createdAt));
}

function withSeen(m: Message): Message {
  const s = seenBy.get(m.id);
  const seen = !!s && [...s].some((u) => u !== m.sender.id);
  return { ...m, sender: { ...m.sender, availability: undefined }, seen };
}

export function getMessages(id: number, after?: number): Message[] {
  ensureConversation(id);
  const list = (msgs.get(id) ?? []).map(withSeen);
  return after ? list.filter((m) => m.id > after) : list;
}

/** Marque comme lus (par l'utilisateur courant) les messages des autres. */
export function markSeen(id: number) {
  ensureConversation(id);
  const me = getActor().id;
  let upTo = 0;
  let changed = false;
  for (const m of msgs.get(id) ?? []) {
    if (m.sender.id !== me && !seenBy.get(m.id)?.has(me)) {
      markSeenBy(m, me);
      changed = true;
    }
    upTo = Math.max(upTo, m.id);
  }
  if (changed) {
    emitConv(id, { type: "seen", userId: me, upTo });
    emitMessaging("seen", id);
  }
}

export function setTyping(id: number, typing: boolean) {
  const me = getActor();
  emitConv(id, { type: "typing", userId: me.id, name: actorName(me), typing });
}

// ───────────────────────────── Envoi & réponses automatiques ─────────────────────────────
function deliver(id: number, m: Message) {
  emitConv(id, { type: "message", messageId: m.id });
  emitMessaging("message", id);
}

function typingThen(id: number, agent: Participant, ms: number, then: () => void) {
  realtime.emit<ConversationEvent>(channels.conversation(id), { type: "typing", userId: agent.id, name: agent.name, typing: true });
  setTimeout(() => {
    realtime.emit<ConversationEvent>(channels.conversation(id), { type: "typing", userId: agent.id, name: agent.name, typing: false });
    then();
  }, ms);
}

function agentSays(id: number, agent: Participant, text: string) {
  if (!msgs.has(id)) return;
  typingThen(id, agent, 1400, () => {
    const m = push(id, agent, text, Date.now() + MIN);
    markSeenBy(m, agent.id, MANAGER_ID === agent.id ? 4 : MANAGER_ID);
    deliver(id, m);
    const c = convs.get(id);
    const buyerNotif = c && c.buyerId;
    if (buyerNotif) realtime.emit<UserEvent>(channels.user(buyerNotif), { type: "notification", notificationId: 0 });
  });
}

export function appendMessage(id: number, content: string | null, image: string | null): Message {
  ensureConversation(id);
  const me = currentParticipant();
  const c = convs.get(id)!;
  if (c.manualConcluded || (orderOf(c) && isFinal(orderOf(c)!.status))) throw new ApiError(400, "Cette discussion est clôturée.");
  const m = push(id, me, content, Date.now() + MIN, null, image);
  markSeenBy(m, me.id);
  if (me.role === "revendeur" || me.role === "mukubwa" || me.role === "admin") {
    // le revendeur / responsable devient participant (équivalent revendeur_reply / mukubwa_reply)
    if (!c.extra.includes(me.id) && me.id !== MANAGER_ID) c.extra.push(me.id);
  }
  deliver(id, m);
  if (me.role === "client") {
    const assigned = assignedOf(c);
    const agent = assigned && assigned.availability !== "offline" ? participantById(assigned.id)! : participantById(MANAGER_ID)!;
    const replies = [
      "Bien reçu, je regarde cela tout de suite.",
      "Merci pour l'information ! Je vous confirme la disponibilité dans quelques instants.",
      "Parfait. Pour le paiement, vous pouvez utiliser Orange Money, Airtel Money, M-Pesa ou régler en cash à la livraison.",
    ];
    const text = image && !content ? "Merci pour la photo, c'est bien noté 👍" : replies[Math.floor(Math.random() * replies.length)];
    setTimeout(() => agentSays(id, agent, text), 1200 + Math.random() * 900);
  }
  return withSeen(m);
}

/** Lignes de la commande liée (pour la proposition de prix) — lisible par les participants. */
export function orderOfConversation(id: number): { id: number; items: Order["items"]; totalPrice: number } {
  ensureConversation(id);
  const o = orderOf(convs.get(id)!);
  if (!o) throw new ApiError(400, "Aucune commande liée à cette discussion.");
  return { id: o.id, items: o.items.map((i) => ({ ...i })), totalPrice: o.totalPrice };
}

// ───────────────────────────── Proposition de prix ─────────────────────────────
export function proposePrice(id: number, input: PriceProposalInput): Message {
  ensureConversation(id);
  const me = currentParticipant();
  if (!can(getActor(), "price.adjust")) throw new ApiError(403, "Vous ne pouvez pas proposer de prix.");
  const c = convs.get(id)!;
  const order = orderOf(c);
  if (!order) throw new ApiError(400, "Aucune commande liée à cette discussion.");
  const item = order.items.find((i) => i.id === input.itemId);
  if (!item) throw new ApiError(400, "Article introuvable.");
  if (!(input.newPrice > 0)) throw new ApiError(400, "Prix invalide.");
  const meta: PriceProposalMeta = {
    type: "price_proposal", proposalId: proposalSeq++, orderId: order.id, itemId: item.id, productName: item.productName, quantity: item.quantity,
    oldPrice: item.unitPrice, newPrice: input.newPrice, reason: input.reason?.trim() || null, status: "pending",
  };
  const m = push(id, me, `Proposition de prix : ${item.productName} à ${fmt(input.newPrice)} (au lieu de ${fmt(item.unitPrice)}).`, Date.now() + MIN, meta as unknown as Record<string, unknown>);
  markSeenBy(m, me.id);
  if (me.id !== MANAGER_ID && !c.extra.includes(me.id)) c.extra.push(me.id);
  deliver(id, m);
  // Démo : si le client n'est pas l'utilisateur courant, il répond automatiquement après quelques secondes
  if (getActor().id !== c.buyerId) setTimeout(() => respondProposalInternal(m.id, Math.random() < 0.85, c.buyerId), 6500);
  return withSeen(m);
}

function respondProposalInternal(messageId: number, accept: boolean, byUserId: number) {
  let conversationId = 0;
  let msg: Message | undefined;
  for (const [cid, list] of msgs) {
    const f = list.find((x) => x.id === messageId);
    if (f) {
      msg = f;
      conversationId = cid;
    }
  }
  if (!msg) throw new ApiError(404, "Proposition introuvable");
  const meta = msg.metadata as unknown as PriceProposalMeta;
  if (meta.status !== "pending") throw new ApiError(409, "Cette proposition a déjà reçu une réponse.");
  const order = DB.orders.find((o) => o.id === meta.orderId);
  const buyer = participantById(byUserId);
  meta.status = accept ? "accepted" : "refused";
  if (accept && order) {
    const item = order.items.find((i) => i.id === meta.itemId);
    if (item) {
      item.unitPrice = meta.newPrice;
      order.totalPrice = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      order.statusHistory.push({ status: order.status, at: new Date().toISOString(), by: { id: byUserId, name: buyer?.name ?? "Client", role: "client" }, note: `Prix accepté : ${item.productName} ${fmt(meta.oldPrice)} → ${fmt(meta.newPrice)}` });
    }
  }
  const sys = push(conversationId, SYSTEM_PARTICIPANT, accept ? `Prix mis à jour : ${meta.productName} passe à ${fmt(meta.newPrice)}. Nouveau total : ${fmt(order?.totalPrice ?? 0)}.` : `Proposition refusée par ${buyer?.name ?? "le client"} : le prix reste à ${fmt(meta.oldPrice)}.`, Date.now() + MIN, { type: "system" });
  markSeenBy(sys, ...[byUserId, MANAGER_ID, 4]);
  emitConv(conversationId, { type: "message", messageId: sys.id });
  emitMessaging("message", conversationId);
  if (order) realtime.emit<UserEvent>(channels.user(order.user.id), { type: "order.status", orderId: order.id, status: order.status });
}

export function respondProposal(messageId: number, accept: boolean) {
  const me = getActor();
  const msg = [...msgs.values()].flat().find((x) => x.id === messageId);
  if (!msg) throw new ApiError(404, "Proposition introuvable");
  const meta = msg.metadata as unknown as PriceProposalMeta;
  const order = DB.orders.find((o) => o.id === meta.orderId);
  if (!order || order.user.id !== me.id) throw new ApiError(403, "Seul le client concerné peut répondre.");
  respondProposalInternal(messageId, accept, me.id);
}

// ───────────────────────────── Clôture & assignation ─────────────────────────────
export function concludeConversation(id: number) {
  const c = convs.get(id);
  if (!c) return;
  c.manualConcluded = true;
  emitMessaging("conversation", id);
}

function afterAssignment(order: Order) {
  const c = convs.get(order.id);
  if (!c) return;
  const r = order.assignedRevendeur;
  notifications.filter((x) => x.conversationId === order.id && x.userId === 0 && x.type === "order").forEach((x) => {
    x.isOrderAssigned = true;
    x.isRead = true;
  });
  if (r) {
    const sys = push(order.id, SYSTEM_PARTICIPANT, `${r.name} a été assigné à votre commande.`, Date.now() + MIN, { type: "system" });
    markSeenBy(sys, MANAGER_ID, 4);
    emitConv(order.id, { type: "message", messageId: sys.id });
    emitMessaging("conversation", order.id);
  }
}

/** Assignation d'une discussion hors commande. */
export function assignDiscussionTo(conversationId: number, resellerId: number) {
  const c = convs.get(conversationId);
  const r = userById(resellerId);
  if (!c || !r || r.role !== "revendeur") throw new ApiError(400, "Revendeur introuvable");
  if (!r.active) throw new ApiError(400, "Ce revendeur est désactivé.");
  if (!c.extra.includes(r.id)) c.extra.push(r.id);
  notifications.filter((x) => x.conversationId === conversationId && x.userId === 0).forEach((x) => {
    x.isOrderAssigned = true;
    x.isRead = true;
  });
  notify([r.id], { conversationId, title: "Assignation de discussion", body: "Vous avez été appelé à avoir une nouvelle discussion avec un client.", type: "chat", isOrderAssigned: true });
  emitMessaging("conversation", conversationId);
}

/** Le revendeur décline la commande : elle retourne « en attente » chez les responsables. */
export function declineAssignment(notificationId: number, message?: string) {
  const n = notifications.find((x) => x.id === notificationId);
  if (!n) return;
  const me = getActor();
  const o = DB.orders.find((x) => x.id === n.conversationId);
  if (o && o.assignedRevendeur?.id === me.id && !isFinal(o.status)) {
    o.assignedRevendeur = null;
    o.status = "attente";
    o.statusHistory.push({ status: "attente", at: new Date().toISOString(), by: { id: me.id, name: actorName(me), role: me.role }, note: `Assignation déclinée${message ? ` — ${message}` : ""}` });
    notify(["managers"], { conversationId: o.id, title: "Commande déclinée", body: `${actorName(me)} a décliné la commande #${o.id}.`, type: "order", isOrderAssigned: false });
    emitMessaging("conversation", o.id);
  }
  n.isRead = true;
}

// ───────────────────────────── Notifications ─────────────────────────────
export function listNotifications(): Notification[] {
  seed();
  const a = getActor();
  const mine = (n: Notification) => (a.role === "client" ? false : can(a, "inbox.view.all") ? n.userId === 0 || n.userId === a.id : n.userId === a.id);
  return notifications.filter(mine).sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt)).map((n) => ({ ...n }));
}

export function patchNotification(id: number, patch: Partial<Notification>) {
  const n = notifications.find((x) => x.id === id);
  if (n) Object.assign(n, patch);
  return n;
}

export function notificationById(id: number) {
  return notifications.find((x) => x.id === id) ?? null;
}

export function addParticipant(conversationId: number, userId: number) {
  const c = convs.get(conversationId);
  if (c && userId !== MANAGER_ID && !c.extra.includes(userId)) c.extra.push(userId);
}

/** Revendeurs assignables (actifs) avec présence et charge. */
export function resellerOptions() {
  return resellers()
    .filter((u) => u.active)
    .map((u) => ({
      id: u.id,
      name: fullName(u),
      availability: (u.availability ?? "online") as Availability,
      code: u.codeRevendeur ?? "",
      openOrders: DB.orders.filter((o) => o.assignedRevendeur?.id === u.id && !isFinal(o.status)).length,
    }))
    .sort((a, b) => a.openOrders - b.openOrders || a.name.localeCompare(b.name));
}

export const presenceEvent = (userId: number, availability: Availability): PresenceEvent => ({ type: "availability", userId, availability });
export const MOCK_RESELLER_OPTIONS = resellerOptions;
