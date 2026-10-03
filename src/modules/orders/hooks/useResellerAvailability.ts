"use client";

import { useState } from "react";
import { useRealtime } from "@/shared/hooks/useRealtime";
import { channels, type PresenceEvent } from "@/shared/lib/realtime";
import type { ResellerAvailability as Availability } from "@/modules/auth/types";

/**
 * Disponibilité d'un revendeur (en ligne / absent / hors ligne) : valeur connue (`initial`, ex. fiche commande)
 * puis mises à jour en temps réel via le canal `presence`.
 */
export function useResellerAvailability(resellerId: number | null | undefined, initial?: Availability | null): Availability | undefined {
  const [live, setLive] = useState<Availability | undefined>();
  useRealtime<PresenceEvent>(channels.presence, (e) => {
    if (e.type === "availability" && e.userId === resellerId) setLive(e.availability);
  });
  if (!resellerId) return undefined;
  return live ?? initial ?? undefined;
}
