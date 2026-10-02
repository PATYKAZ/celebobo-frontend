"use client";

import { useState } from "react";
import { env } from "@/config/env";
import { useRealtime } from "@/shared/hooks/useRealtime";
import { channels, type PresenceEvent } from "@/shared/lib/realtime";
import { userById, type Availability } from "@/shared/mock-db";

/**
 * Disponibilité d'un revendeur (en ligne / absent / hors ligne), mise à jour en temps réel via le canal `presence`.
 * Mock : lit la base de démo ; API : renvoie `undefined` tant que le backend n'expose pas la présence
 * (le point reste masqué). Brancher ici `GET /users/{id}/presence/` ou le champ `availability` de la commande.
 */
export function useResellerAvailability(resellerId: number | null | undefined): Availability | undefined {
  const [live, setLive] = useState<Availability | undefined>();
  useRealtime<PresenceEvent>(channels.presence, (e) => {
    if (e.type === "availability" && e.userId === resellerId) setLive(e.availability);
  });
  if (!resellerId) return undefined;
  return live ?? (env.USE_MOCKS ? userById(resellerId)?.availability : undefined);
}
