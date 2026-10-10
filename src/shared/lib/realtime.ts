"use client";

import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, camelizeKeys } from "@/shared/lib/api";

/**
 * Couche temps réel unique.
 *
 * Canaux (convention front) :
 *   conversation:{id}  → { type: "message" | "typing" | "seen" | "conversation", ... }
 *   user:{id}          → { type: "notification" | "unread" | "conversation" | "order.created" | "order.status" | "assignment", ... }
 *   presence           → { type: "availability", userId, availability }
 *   messaging          → { type: "message" | "seen" | "conversation", conversationId } (toute discussion visible)
 *   event:{type}       → données brutes (camelCase) de chaque événement serveur (ex. `event:sale.created`)
 *   `{ type: "resync" }` est diffusé sur tous les canaux écoutés après une reconnexion (événements manqués).
 *
 * WebSocket `env.WS_URL` (passerelle Django Channels `/ws/`), ouvert uniquement pour un utilisateur
 *   connecté (`realtime.setSession`). Chaque connexion consomme un ticket à usage unique (`POST /auth/ws-ticket/`)
 *   passé en `?ticket=`. Protocole : `{ type, data, ref? }` dans les deux sens ; le serveur abonne d'office aux
 *   groupes `user.{id}` (+ `staff`), le client s'abonne aux discussions (`conversation.subscribe`).
 *   Reconnexion exponentielle (1 s → 30 s), réabonnement après `session.ready`, battement `presence.ping` toutes les 30 s.
 */
export type RealtimeHandler<T = unknown> = (payload: T) => void;

type ServerMessage = { type: string; data?: Record<string, unknown>; ref?: string };

const HEARTBEAT_MS = 30_000;
const MAX_BACKOFF_MS = 30_000;
const UNAUTHORIZED_CLOSE = 4401;

const listeners = new Map<string, Set<RealtimeHandler>>();
const statusListeners = new Set<() => void>();
let session: number | null = null;
let socket: WebSocket | null = null;
let connecting = false;
let connected = false;
let everConnected = false;
let retry = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let heartbeat: ReturnType<typeof setInterval> | undefined;

const conversationOf = (channel: string) => (channel.startsWith("conversation:") ? Number(channel.slice(13)) : null);

function dispatch(channel: string, payload: unknown) {
  listeners.get(channel)?.forEach((h) => h(payload));
}

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  statusListeners.forEach((l) => l());
}

function send(type: string, data: Record<string, unknown> = {}) {
  if (!connected || socket?.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify({ type, data }));
  return true;
}

function subscribeConversation(channel: string, on: boolean) {
  const id = conversationOf(channel);
  if (id && id > 0) send(on ? "conversation.subscribe" : "conversation.unsubscribe", { conversation_id: id });
}

/** Traduit un événement serveur vers les canaux front. */
function route({ type, data: raw = {} }: ServerMessage) {
  const data = camelizeKeys<Record<string, unknown>>(raw);
  const me = session != null ? channels.user(session) : null;
  const conversationId = typeof data.conversationId === "number" ? data.conversationId : null;
  dispatch(channels.event(type), data);

  switch (type) {
    case "message.created": {
      const message = data.message as { id: number };
      if (conversationId) dispatch(channels.conversation(conversationId), { type: "message", messageId: message.id, message });
      dispatch(channels.messaging, { type: "message", conversationId });
      break;
    }
    case "conversation.typing":
      if (conversationId) dispatch(channels.conversation(conversationId), { type: "typing", userId: data.userId, name: data.name, typing: data.typing });
      break;
    case "conversation.read":
      if (conversationId) dispatch(channels.conversation(conversationId), { type: "seen", userId: data.userId, upTo: data.messageId });
      dispatch(channels.messaging, { type: "seen", conversationId });
      break;
    case "conversation.updated":
    case "conversation.closed":
    case "conversation.reopened":
    case "conversation.assigned":
      if (conversationId && type !== "conversation.updated") dispatch(channels.conversation(conversationId), { type: "conversation", conversationId, event: type });
      dispatch(channels.messaging, { type: "conversation", conversationId });
      if (me) dispatch(me, { type: "conversation", conversationId });
      break;
    case "notification.created": {
      const notification = data.notification as { id: number };
      if (me) dispatch(me, { type: "notification", notificationId: notification.id, notification });
      break;
    }
    case "unread.counts":
      if (me) dispatch(me, { type: "unread", notifications: data.notifications, conversations: data.conversations });
      break;
    case "order.created":
      if (me) dispatch(me, { type: "order.created", orderId: data.orderId, number: data.number, status: data.status });
      break;
    case "order.assigned":
      if (me) dispatch(me, { type: "assignment", orderId: data.orderId, resellerId: data.resellerId });
      break;
    case "order.status_changed":
    case "order.updated":
      if (me) dispatch(me, { type: "order.status", orderId: data.orderId, number: data.number, status: data.status });
      break;
    case "presence.changed":
      dispatch(channels.presence, { type: "availability", userId: data.userId, availability: data.availability ?? (data.online ? "online" : "offline") });
      break;
  }
}

/** `NEXT_PUBLIC_WS_URL` absolu (ws://…) ou relatif (`/ws/`, même domaine que le site derrière nginx). */
function socketUrl() {
  if (!env.WS_URL.startsWith("/")) return env.WS_URL;
  return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${env.WS_URL}`;
}

function scheduleReconnect() {
  clearTimeout(retryTimer);
  if (session == null) return;
  const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** retry++) + Math.random() * 500;
  retryTimer = setTimeout(connect, delay);
}

async function connect() {
  if (!env.WS_URL || typeof WebSocket === "undefined" || session == null || socket || connecting) return;
  // onglet en arrière-plan : on se connectera quand il redeviendra visible (cf. `wake`)
  if (document.visibilityState === "hidden") return;
  connecting = true;
  const owner = session;
  let ticket: string;
  try {
    ({ ticket } = await api.post<{ ticket: string }>(ENDPOINTS.auth.wsTicket));
  } catch (error) {
    connecting = false;
    // ticket refusé (hors session expirée, gérée par le client API) : inutile d'insister
    const refused = error instanceof ApiError && error.status >= 400 && error.status < 500;
    if (session === owner && !refused) scheduleReconnect();
    return;
  }
  connecting = false;
  if (session !== owner || socket) return;

  const ws = new WebSocket(`${socketUrl()}${env.WS_URL.includes("?") ? "&" : "?"}ticket=${encodeURIComponent(ticket)}`);
  socket = ws;
  ws.onmessage = (e) => {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(e.data) as ServerMessage;
    } catch {
      return;
    }
    if (msg.type !== "session.ready") return route(msg);
    retry = 0;
    setConnected(true);
    listeners.forEach((_, channel) => subscribeConversation(channel, true));
    clearInterval(heartbeat);
    heartbeat = setInterval(() => send("presence.ping"), HEARTBEAT_MS);
    if (everConnected) listeners.forEach((set) => set.forEach((h) => h({ type: "resync" })));
    everConnected = true;
  };
  ws.onclose = (e) => {
    if (socket !== ws) return;
    socket = null;
    clearInterval(heartbeat);
    setConnected(false);
    if (e.code === UNAUTHORIZED_CLOSE) retry = Math.max(retry, 2);
    scheduleReconnect();
  };
}

function disconnect() {
  clearTimeout(retryTimer);
  clearInterval(heartbeat);
  const ws = socket;
  socket = null;
  everConnected = false;
  retry = 0;
  setConnected(false);
  ws?.close(1000);
}

if (typeof window !== "undefined") {
  const wake = () => {
    if (session == null || socket || connecting) return;
    retry = 0;
    clearTimeout(retryTimer);
    connect();
  };
  window.addEventListener("online", wake);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && wake());
}

export const realtime = {
  /** Ouvre (id utilisateur) ou ferme (`null`) la connexion temps réel. Appelé par la synchronisation de session. */
  setSession(userId: number | null) {
    if (userId === session) return;
    disconnect();
    session = userId;
    connect();
  },

  /** true quand la passerelle WebSocket est connectée (les écrans réduisent alors leur polling). */
  isConnected: () => connected,

  onStatus(listener: () => void): () => void {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  },

  /** S'abonne à un canal. Retourne la fonction de désabonnement. */
  subscribe<T = unknown>(channel: string, handler: RealtimeHandler<T>): () => void {
    let set = listeners.get(channel);
    if (!set) {
      listeners.set(channel, (set = new Set()));
      subscribeConversation(channel, true);
    }
    set.add(handler as RealtimeHandler);
    return () => {
      set.delete(handler as RealtimeHandler);
      if (!set.size && listeners.get(channel) === set) {
        listeners.delete(channel);
        subscribeConversation(channel, false);
      }
    };
  },

  /** L'indicateur « écrit… » part au serveur ; les autres événements sont diffusés localement. */
  emit<T = unknown>(channel: string, payload: T) {
    const id = conversationOf(channel);
    const event = payload as { type?: string; typing?: boolean };
    if (id && event.type === "typing") {
      send(event.typing ? "typing.start" : "typing.stop", { conversation_id: id });
      return;
    }
    dispatch(channel, payload);
  },

  /** Message brut vers la passerelle (ex. `message.read`). Retourne false si la connexion est fermée. */
  send,
};

export const channels = {
  conversation: (id: number | string) => `conversation:${id}`,
  user: (id: number | string) => `user:${id}`,
  presence: "presence",
  messaging: "messaging",
  event: (type: string) => `event:${type}`,
};

/** Événements typés. */
export type ResyncEvent = { type: "resync" };

export type ConversationEvent =
  | { type: "message"; messageId: number; message?: unknown }
  | { type: "typing"; userId: number; name: string; typing: boolean }
  | { type: "seen"; userId: number; upTo: number }
  | { type: "conversation"; conversationId: number; event?: string }
  | ResyncEvent;

/** `status` : statut brut de l'API (pending, assigned, paid…) en mode API. */
export type UserEvent =
  | { type: "notification"; notificationId: number; notification?: unknown }
  | { type: "unread"; notifications: number; conversations: number }
  | { type: "conversation"; conversationId: number }
  | { type: "order.created"; orderId: number; number?: string; status: string }
  | { type: "order.status"; orderId: number; number?: string; status: string }
  | { type: "assignment"; orderId: number; resellerId?: number }
  | ResyncEvent;

/** Après une reconnexion, les abonnés reçoivent aussi `{ type: "resync" }` (sans `userId`). */
export type PresenceEvent = { type: "availability"; userId: number; availability: "online" | "away" | "offline" };
