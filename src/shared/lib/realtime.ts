"use client";

import { env } from "@/config/env";

/**
 * Couche temps réel unique.
 *
 * Canaux (convention) :
 *   conversation:{id}  → { type: "message" | "typing" | "seen" | "presence", ... }
 *   user:{id}          → { type: "notification" | "order.status" | "assignment", ... }
 *   presence           → { type: "availability", userId, availability }
 *
 * - MODE MOCK : bus en mémoire. Les services mock appellent `realtime.emit(...)` quand ils mutent un état,
 *   et les composants reçoivent l'événement exactement comme avec un vrai serveur.
 * - MODE API : WebSocket vers `NEXT_PUBLIC_WS_URL` (ex: wss://api.celebobo.com/ws/) avec reconnexion
 *   exponentielle ; message attendu : { channel, payload }. À défaut : le polling React Query prend le relais.
 */
export type RealtimeHandler<T = unknown> = (payload: T) => void;

const listeners = new Map<string, Set<RealtimeHandler>>();
let socket: WebSocket | null = null;
let retry = 0;
const wanted = new Set<string>();

function connect() {
  const url = process.env.NEXT_PUBLIC_WS_URL;
  if (env.USE_MOCKS || !url || typeof WebSocket === "undefined" || socket) return;
  socket = new WebSocket(url);
  socket.onopen = () => {
    retry = 0;
    wanted.forEach((c) => socket?.send(JSON.stringify({ action: "subscribe", channel: c })));
  };
  socket.onmessage = (e) => {
    try {
      const { channel, payload } = JSON.parse(e.data) as { channel: string; payload: unknown };
      listeners.get(channel)?.forEach((h) => h(payload));
    } catch {
      /* message ignoré */
    }
  };
  socket.onclose = () => {
    socket = null;
    if (wanted.size) setTimeout(connect, Math.min(30000, 1000 * 2 ** retry++));
  };
}

export const realtime = {
  /** S'abonne à un canal. Retourne la fonction de désabonnement. */
  subscribe<T = unknown>(channel: string, handler: RealtimeHandler<T>): () => void {
    let set = listeners.get(channel);
    if (!set) listeners.set(channel, (set = new Set()));
    set.add(handler as RealtimeHandler);
    if (!wanted.has(channel)) {
      wanted.add(channel);
      socket?.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ action: "subscribe", channel }));
    }
    connect();
    return () => {
      set.delete(handler as RealtimeHandler);
      if (!set.size) {
        listeners.delete(channel);
        wanted.delete(channel);
        socket?.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ action: "unsubscribe", channel }));
      }
    };
  },

  /** Émet localement (mock) ou vers le serveur (API). */
  emit<T = unknown>(channel: string, payload: T) {
    if (env.USE_MOCKS || !socket || socket.readyState !== WebSocket.OPEN) {
      listeners.get(channel)?.forEach((h) => h(payload));
      return;
    }
    socket.send(JSON.stringify({ action: "publish", channel, payload }));
  },
};

export const channels = {
  conversation: (id: number | string) => `conversation:${id}`,
  user: (id: number | string) => `user:${id}`,
  presence: "presence",
};

/** Événements typés. */
export type ConversationEvent =
  | { type: "message"; messageId: number }
  | { type: "typing"; userId: number; name: string; typing: boolean }
  | { type: "seen"; userId: number; upTo: number };

export type UserEvent =
  | { type: "notification"; notificationId: number }
  | { type: "order.status"; orderId: number; status: string }
  | { type: "assignment"; orderId: number };

export type PresenceEvent = { type: "availability"; userId: number; availability: "online" | "away" | "offline" };
