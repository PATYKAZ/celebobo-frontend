"use client";

import { useQuery } from "@tanstack/react-query";
import { useHydrationSafe } from "@/shared/hooks/useHydrationSafe";
import { siteKeys } from "../keys";
import { FALLBACK_SETTINGS } from "../services/site.mapper";
import { siteService } from "../services/site.service";
import type { SiteSettings } from "../types";

/**
 * Réglages publics (hotline, adresse, réseaux…), fournis par le serveur (layout boutique) ; valeurs statiques
 * de `SITE` tant que l'API n'a pas répondu.
 */
export function useSiteSettings(): SiteSettings {
  // 60 s, comme le cache HTTP de l'API : un nouveau taux du franc s'affiche dans la minute
  const { data } = useQuery({ queryKey: siteKeys.settings, queryFn: siteService.settings, staleTime: 60_000, refetchOnWindowFocus: true });
  return useHydrationSafe(siteKeys.settings, data) ?? FALLBACK_SETTINGS;
}
