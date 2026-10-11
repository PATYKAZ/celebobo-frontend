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
  const { data } = useQuery({ queryKey: siteKeys.settings, queryFn: siteService.settings, staleTime: 30 * 60_000 });
  return useHydrationSafe(siteKeys.settings, data) ?? FALLBACK_SETTINGS;
}
