import type { OpeningHours, SocialNetwork } from "@/modules/site/types";
import type { AdminShippingZone, AdminSiteSettings, SettingsFormValues, ZoneFormValues, ZonePricing } from "../types";

/** `GET /bo/settings/` (après camelCase). */
export interface AdminSettingsDto {
  usdToCdf: string;
  hotline: string;
  whatsapp: string;
  email: string;
  address: string;
  openingHours: OpeningHours[];
  paymentMethods: string[];
  socialLinks: Record<string, string>;
  newsletterCode: string;
  newsletterDiscount: number;
  returnDays?: number;
  supportAlwaysOpen?: boolean;
}

export interface ZoneDto {
  id: number;
  name: string;
  cities: string[];
  fee: string;
  freeThreshold: string | null;
  deliveryEstimate: string;
  isDefault: boolean;
  isActive: boolean;
  position: number;
  pricing?: ZonePricing;
  pickupAddress?: string;
}

export const toAdminSettings = (dto: AdminSettingsDto): AdminSiteSettings => ({
  usdToCdf: Number(dto.usdToCdf),
  hotline: dto.hotline,
  whatsapp: dto.whatsapp,
  email: dto.email,
  address: dto.address,
  openingHours: dto.openingHours ?? [],
  paymentMethods: dto.paymentMethods ?? [],
  social: (dto.socialLinks ?? {}) as Partial<Record<SocialNetwork, string>>,
  newsletterCode: dto.newsletterCode,
  newsletterDiscount: dto.newsletterDiscount,
  returnDays: dto.returnDays ?? 7,
  supportAlwaysOpen: dto.supportAlwaysOpen ?? true,
});

export const settingsToForm = (s: AdminSiteSettings): SettingsFormValues => ({
  ...s,
  usdToCdf: s.usdToCdf.toFixed(2),
  openingHours: s.openingHours.map((h) => ({ ...h })),
  newsletterDiscount: String(s.newsletterDiscount),
  returnDays: String(s.returnDays),
});

/** Corps du PATCH : liens sociaux vides retirés, horaires incomplets ignorés. */
export const toSettingsPayload = (v: SettingsFormValues) => ({
  usdToCdf: Number(v.usdToCdf).toFixed(2),
  hotline: v.hotline.trim(),
  whatsapp: v.whatsapp.trim(),
  email: v.email.trim(),
  address: v.address.trim(),
  openingHours: v.openingHours.map((h) => ({ days: h.days.trim(), hours: h.hours.trim() })).filter((h) => h.days && h.hours),
  paymentMethods: v.paymentMethods,
  socialLinks: Object.fromEntries(Object.entries(v.social).filter(([, url]) => url?.trim()).map(([k, url]) => [k, url!.trim()])),
  newsletterCode: v.newsletterCode.trim(),
  newsletterDiscount: Number(v.newsletterDiscount),
  returnDays: Number(v.returnDays),
  supportAlwaysOpen: v.supportAlwaysOpen,
});

export const toAdminZone = (dto: ZoneDto): AdminShippingZone => ({
  id: dto.id,
  name: dto.name,
  cities: dto.cities ?? [],
  fee: Number(dto.fee),
  freeThreshold: dto.freeThreshold != null ? Number(dto.freeThreshold) : null,
  deliveryEstimate: dto.deliveryEstimate,
  isDefault: dto.isDefault,
  isActive: dto.isActive,
  position: dto.position,
  pricing: dto.pricing ?? "flat",
  pickupAddress: dto.pickupAddress ?? "",
});

export const zoneToForm = (z: AdminShippingZone): ZoneFormValues => ({
  name: z.name,
  cities: z.cities.join("\n"),
  fee: z.fee.toFixed(2),
  freeThreshold: z.freeThreshold != null ? z.freeThreshold.toFixed(2) : "",
  deliveryEstimate: z.deliveryEstimate,
  isDefault: z.isDefault,
  isActive: z.isActive,
  pricing: z.pricing,
  pickupAddress: z.pickupAddress,
});

export const toZonePayload = (v: ZoneFormValues) => {
  const flat = v.pricing === "flat";
  const pickup = v.pricing === "pickup";
  return {
    name: v.name.trim(),
    pricing: v.pricing,
    // le retrait se choisit à la commande, sans ville ; sinon une ville par ligne (ou séparées par des virgules), sans doublon
    cities: pickup ? [] : [...new Set(v.cities.split(/[\n,]/).map((c) => c.trim()).filter(Boolean))],
    // sur devis et retrait : aucun frais à la commande
    fee: flat ? Number(v.fee || 0).toFixed(2) : "0.00",
    freeThreshold: flat && v.freeThreshold.trim() ? Number(v.freeThreshold).toFixed(2) : null,
    deliveryEstimate: v.deliveryEstimate.trim(),
    isDefault: pickup ? false : v.isDefault,
    isActive: v.isActive,
    pickupAddress: pickup ? v.pickupAddress.trim() : "",
  };
};
