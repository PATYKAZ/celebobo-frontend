"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { realtime, type RealtimeHandler } from "@/shared/lib/realtime";

/**
 * `useRealtime(channels.conversation(id), (e) => ...)` — abonnement avec nettoyage automatique.
 * Passer `null` comme canal désactive l'abonnement.
 */
export function useRealtime<T = unknown>(channel: string | null, handler: RealtimeHandler<T>) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!channel) return;
    return realtime.subscribe<T>(channel, (p) => ref.current(p));
  }, [channel]);
}

/** À monter une fois : connexion WebSocket ouverte tant qu'un utilisateur est connecté. */
export function useRealtimeSession(userId: number | null) {
  useEffect(() => {
    realtime.setSession(userId);
  }, [userId]);
}

/** true quand la passerelle temps réel est connectée. */
export function useRealtimeConnected() {
  return useSyncExternalStore(realtime.onStatus, realtime.isConnected, () => false);
}
