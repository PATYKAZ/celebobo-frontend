"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/config/env";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useRealtime } from "@/shared/hooks/useRealtime";
import { channels, type PresenceEvent, type UserEvent } from "@/shared/lib/realtime";
import { toast } from "@/shared/ui/Toast";
import { notificationsService } from "../services/notifications.service";

export const notificationKeys = {
  all: ["notifications"] as const,
  resellers: ["notifications", "resellers"] as const,
};

/** ids déjà annoncés par un toast (plusieurs composants utilisent ce hook en même temps). */
const toasted = new Set<number>();

/** Notifications de l'utilisateur courant, mises à jour en direct (+ toast à l'arrivée d'une nouvelle). */
export function useNotifications(enabled = true) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const query = useQuery({ queryKey: notificationKeys.all, queryFn: notificationsService.list, refetchInterval: env.USE_MOCKS ? false : 20000, enabled });

  const onEvent = useCallback(
    async (e: UserEvent) => {
      if (e.type !== "notification") return;
      const id = e.notificationId;
      if (!id || toasted.has(id)) {
        qc.invalidateQueries({ queryKey: notificationKeys.all, exact: true });
        return;
      }
      toasted.add(id);
      const list = await qc.fetchQuery({ queryKey: notificationKeys.all, queryFn: notificationsService.list, staleTime: 0 });
      const n = list.find((x) => x.id === id);
      if (n && !n.isRead) toast.info(n.title, n.body);
    },
    [qc],
  );
  useRealtime<UserEvent>(enabled && user && user.role !== "client" ? channels.user(user.id) : null, onEvent);
  return query;
}

export function useUnreadNotificationsCount(enabled = true) {
  const { data } = useNotifications(enabled);
  return data?.filter((n) => !n.isRead).length ?? 0;
}

/** Revendeurs actifs assignables (avec présence + charge), rafraîchis quand la disponibilité change. */
export function useResellerOptions(enabled = true) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: notificationKeys.resellers, queryFn: notificationsService.resellers, enabled, staleTime: 60_000 });
  useRealtime<PresenceEvent>(enabled ? channels.presence : null, () => qc.invalidateQueries({ queryKey: notificationKeys.resellers, exact: true }));
  return query;
}

function useNotifMutation<V>(fn: (v: V) => Promise<void>) {
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

/** Assigne la commande d'une notification à un revendeur (responsable). */
export const useAssignReseller = () =>
  useNotifMutation(({ notificationId, revendeurId, discussion }: { notificationId: number; revendeurId: number; discussion?: boolean }) =>
    discussion ? notificationsService.assignDiscussion(notificationId, { revendeurId }) : notificationsService.assign(notificationId, { revendeurId }),
  );

export const useMukubwaReply = () => useNotifMutation(({ id, message }: { id: number; message: string }) => notificationsService.mukubwaReply(id, { message }));

export const useRevendeurReply = () =>
  useNotifMutation(({ id, accept, message }: { id: number; accept: boolean; message?: string }) => notificationsService.revendeurReply(id, { accept, message }));

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => notificationsService.markRead(id)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
