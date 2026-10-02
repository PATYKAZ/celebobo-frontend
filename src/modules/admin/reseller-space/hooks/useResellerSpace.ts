"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { MESSAGING_CHANNEL, type Availability } from "@/modules/messaging/types";
import { useRealtime } from "@/shared/hooks/useRealtime";
import { channels, type PresenceEvent, type UserEvent } from "@/shared/lib/realtime";
import { resellerSpaceService } from "../services/reseller-space.service";

export const resellerSpaceKeys = {
  dashboard: ["reseller-space", "dashboard"] as const,
  invites: ["reseller-space", "invites"] as const,
  stats: ["reseller-space", "stats"] as const,
};

/** Tableau de bord revendeur — se met à jour en direct (assignation, statut, messages). */
export function useResellerDashboard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const query = useQuery({ queryKey: [...resellerSpaceKeys.dashboard, user?.id], queryFn: resellerSpaceService.dashboard, enabled: user?.role === "revendeur" });
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: resellerSpaceKeys.dashboard }), [qc]);
  useRealtime<UserEvent>(user ? channels.user(user.id) : null, refresh);
  useRealtime(MESSAGING_CHANNEL, refresh);
  useRealtime<PresenceEvent>(channels.presence, (e) => {
    if (e.userId === user?.id) refresh();
  });
  return query;
}

export function useMyInvites() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...resellerSpaceKeys.invites, user?.id], queryFn: resellerSpaceService.invites, enabled: user?.role === "revendeur" });
}

export function useAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: Availability) => resellerSpaceService.setAvailability(a),
    onSuccess: () => qc.invalidateQueries({ queryKey: resellerSpaceKeys.dashboard }),
  });
}

/** `{ code, invitedCount }` du revendeur connecté, lus dans la source unique (profil, en-tête…). */
export function useMyResellerStats() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...resellerSpaceKeys.stats, user?.id], queryFn: resellerSpaceService.myStats, enabled: user?.role === "revendeur" });
}
