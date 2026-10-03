import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { SiteSettings } from "../types";
import { toSiteSettings, type SiteSettingsDto } from "./site.mapper";

export const siteService = {
  async settings(): Promise<SiteSettings> {
    return toSiteSettings(await api.get<SiteSettingsDto>(ENDPOINTS.site.settings));
  },
};
