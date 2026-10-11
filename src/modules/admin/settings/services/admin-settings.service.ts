import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { AdminShippingZone, AdminSiteSettings, SettingsFormValues, ZoneFormValues } from "../types";
import { toAdminSettings, toAdminZone, toSettingsPayload, toZonePayload, type AdminSettingsDto, type ZoneDto } from "./admin-settings.mapper";

const { settings, shippingZones } = ENDPOINTS.admin;

export const adminSettingsService = {
  async get(): Promise<AdminSiteSettings> {
    return toAdminSettings(await api.get<AdminSettingsDto>(settings));
  },

  async update(values: SettingsFormValues): Promise<AdminSiteSettings> {
    return toAdminSettings(await api.patch<AdminSettingsDto>(settings, toSettingsPayload(values)));
  },

  /** Toutes les zones (actives et inactives), dans l'ordre d'affichage. */
  async zones(): Promise<AdminShippingZone[]> {
    return (await api.get<ZoneDto[]>(shippingZones.list)).map(toAdminZone).sort((a, b) => a.position - b.position || a.id - b.id);
  },

  async createZone(values: ZoneFormValues, position: number): Promise<AdminShippingZone> {
    return toAdminZone(await api.post<ZoneDto>(shippingZones.list, { ...toZonePayload(values), position }));
  },

  async updateZone(id: number, values: ZoneFormValues): Promise<AdminShippingZone> {
    return toAdminZone(await api.patch<ZoneDto>(shippingZones.detail(id), toZonePayload(values)));
  },

  async patchZone(id: number, patch: Partial<Pick<AdminShippingZone, "isActive" | "isDefault" | "position">>): Promise<AdminShippingZone> {
    return toAdminZone(await api.patch<ZoneDto>(shippingZones.detail(id), patch));
  },

  async deleteZone(id: number): Promise<void> {
    await api.delete(shippingZones.detail(id));
  },
};
