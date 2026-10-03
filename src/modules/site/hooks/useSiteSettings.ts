"use client";

import { useQuery } from "@tanstack/react-query";
import { FALLBACK_SETTINGS } from "../services/site.mapper";
import { siteService } from "../services/site.service";
import type { SiteSettings } from "../types";

/** Réglages publics (hotline, adresse, réseaux…) ; valeurs statiques de `SITE` tant que l'API n'a pas répondu. */
export function useSiteSettings(): SiteSettings {
  const { data } = useQuery({ queryKey: ["site", "settings"], queryFn: siteService.settings, staleTime: 30 * 60_000 });
  return data ?? FALLBACK_SETTINGS;
}
