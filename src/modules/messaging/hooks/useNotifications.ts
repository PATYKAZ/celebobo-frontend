"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "../services/notifications.service";

export const notificationKeys = {
  all: ["notifications"] as const,
  resellers: ["notifications", "resellers"] as const,
};

export function useNotifications(enabled = true) {
  return useQuery({ queryKey: notificationKeys.all, queryFn: notificationsService.list, refetchInterval: 15000, enabled });
}

export function useUnreadNotificationsCount(enabled = true) {
  const { data } = useNotifications(enabled);
  return data?.filter((n) => !n.isRead).length ?? 0;
}

export function useResellerOptions(enabled = true) {
  return useQuery({ queryKey: notificationKeys.resellers, queryFn: notificationsService.resellers, enabled, staleTime: 5 * 60_000 });
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

/** Assigne la commande d'une notification à un revendeur (mukubwa). */
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
