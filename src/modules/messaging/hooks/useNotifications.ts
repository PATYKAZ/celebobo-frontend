"use client";

import { useCallback } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useRealtime, useRealtimeConnected } from "@/shared/hooks/useRealtime";
import { channels, type PresenceEvent, type UserEvent } from "@/shared/lib/realtime";
import { toast } from "@/shared/ui/Toast";
import { conversationsService } from "../services/conversations.service";
import { toNotification, type NotificationDto } from "../services/messaging.mapper";
import { notificationsService } from "../services/notifications.service";
import { MESSAGING_CHANNEL, type Notification, type UnreadCounts } from "../types";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (userId: number | undefined, page: number, pageSize: number) => ["notifications", "list", userId, page, pageSize] as const,
  counts: (userId: number | undefined) => ["notifications", "counts", userId] as const,
  resellers: ["notifications", "resellers"] as const,
};

/** ids déjà annoncés par un toast (plusieurs composants écoutent le même canal). */
const toasted = new Set<number>();

/** Notifications paginées de l'utilisateur courant, rafraîchies à l'arrivée d'une nouvelle. */
export function useNotifications(page = 1, pageSize = 6) {
  const { user } = useAuth();
  const live = useRealtimeConnected();
  return useQuery({
    queryKey: notificationKeys.list(user?.id, page, pageSize),
    queryFn: () => notificationsService.list({ page, pageSize }),
    enabled: !!user,
    placeholderData: keepPreviousData,
    refetchInterval: live ? false : 30000,
  });
}

/**
 * Compteurs non lus (notifications + discussions) : `unread.counts` du WebSocket, toast à chaque nouvelle notification,
 * polling de secours si la connexion tombe. Monté par les badges (header, barre d'onglets, back-office).
 */
export function useUnreadCounts() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const live = useRealtimeConnected();
  const key = notificationKeys.counts(user?.id);
  const query = useQuery({ queryKey: key, queryFn: notificationsService.counts, enabled: !!user, refetchInterval: live ? false : 30000 });

  const onEvent = useCallback(
    (e: UserEvent) => {
      if (e.type === "unread") return qc.setQueryData<UnreadCounts>(key, { notifications: e.notifications, conversations: e.conversations });
      if (e.type === "resync") return qc.invalidateQueries({ queryKey: notificationKeys.all });
      if (e.type !== "notification") return;
      qc.invalidateQueries({ queryKey: ["notifications", "list"] });
      if (toasted.has(e.notificationId) || !e.notification) return;
      toasted.add(e.notificationId);
      const n: Notification = toNotification(e.notification as NotificationDto);
      // pas de toast pour un message de la discussion déjà ouverte
      if (n.kind === "new_message" && n.conversationId && window.location.pathname.endsWith(`/messages/${n.conversationId}`)) return;
      toast.info(n.title, n.body);
    },
    [qc, key],
  );
  useRealtime<UserEvent>(user ? channels.user(user.id) : null, onEvent);
  // un nouveau message ne crée pas toujours de notification : on relit le compteur de discussions
  useRealtime(user ? MESSAGING_CHANNEL : null, () => qc.invalidateQueries({ queryKey: key, exact: true }));
  return query;
}

export function useUnreadNotificationsCount(enabled = true) {
  const { data } = useUnreadCounts();
  return enabled ? data?.notifications ?? 0 : 0;
}

/** Revendeurs assignables (avec présence + charge), rafraîchis quand la disponibilité change. */
export function useResellerOptions(enabled = true) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: notificationKeys.resellers, queryFn: notificationsService.resellers, enabled, staleTime: 60_000 });
  useRealtime<PresenceEvent>(enabled ? channels.presence : null, () => qc.invalidateQueries({ queryKey: notificationKeys.resellers, exact: true }));
  return query;
}

function useNotifMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export const useMarkNotificationRead = () => useNotifMutation((id: number) => notificationsService.markRead(id));

export const useMarkAllRead = () => useNotifMutation(() => notificationsService.markAllRead());

/** Responsable : assigner la commande (« Nouvelle commande ») ou la discussion de support (« Nouvelle discussion ») d'une notification. */
export const useAssignReseller = () =>
  useNotifMutation(async ({ notification: n, revendeurId }: { notification: Notification; revendeurId: number }) => {
    if (n.kind === "support_request" && n.conversationId) await conversationsService.assign(n.conversationId, revendeurId);
    else if (n.orderId) await notificationsService.assignOrder(n.orderId, revendeurId);
    if (!n.isRead) await notificationsService.markRead(n.id);
  });

/** Revendeur : accepter (la notification est lue) ou décliner la commande assignée. */
export const useRevendeurReply = () =>
  useNotifMutation(async ({ notification: n, accept, message }: { notification: Notification; accept: boolean; message?: string }) => {
    if (!accept && n.orderId) await notificationsService.declineOrder(n.orderId, message);
    await notificationsService.markRead(n.id);
  });
