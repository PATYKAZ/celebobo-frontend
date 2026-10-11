import "server-only";
import { cache } from "react";
import { ENDPOINTS } from "@/config/endpoints";
import { serverGet } from "@/shared/lib/api/server";
import { toSiteSettings, type SiteSettingsDto } from "./services/site.mapper";
import type { SiteSettings } from "./types";

/**
 * Réglages publics côté serveur (une requête par rendu). Django revalide l'étiquette « home » quand les réglages
 * changent (taux du franc, coordonnées…) : sans elle, le nouveau taux n'apparaissait qu'à l'expiration du cache.
 */
export const loadSettings = cache(async (): Promise<{ settings: SiteSettings; currency: string } | null> => {
  const res = await serverGet<SiteSettingsDto & { currency?: string }>(ENDPOINTS.site.settings, { revalidate: 300, tags: ["settings", "home"] });
  return res.ok ? { settings: toSiteSettings(res.data), currency: res.data.currency || "USD" } : null;
});
