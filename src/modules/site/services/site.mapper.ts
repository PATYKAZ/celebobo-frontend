import { SITE } from "@/config/site";
import type { SiteSettings, SocialNetwork } from "../types";

/** Réponse de `GET /settings/public/` (après camelCase). */
export interface SiteSettingsDto {
  usdToCdf: string;
  hotline: string;
  whatsapp: string;
  whatsappUrl: string;
  email: string;
  address: string;
  openingHours: { days?: string; hours?: string }[];
  paymentMethods: string[];
  socialLinks: Record<string, string>;
  newsletterDiscount: number;
  shipping: { freeThreshold: string | null; flatFee: string };
}

const NETWORKS: Record<string, SocialNetwork> = { facebook: "facebook", instagram: "instagram", tiktok: "tiktok", twitter: "x", x: "x", youtube: "youtube", linkedin: "linkedin" };

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** « Rue, Quartier, Ville » → ["Rue, Quartier", "Ville"]. */
function addressLines(address: string): string[] {
  const i = address.lastIndexOf(",");
  return i < 0 ? [address] : [address.slice(0, i).trim(), address.slice(i + 1).trim()];
}

export function toSiteSettings(dto: SiteSettingsDto): SiteSettings {
  const social: SiteSettings["social"] = {};
  for (const [key, url] of Object.entries(dto.socialLinks ?? {})) {
    const network = NETWORKS[key.toLowerCase()];
    if (network && url) social[network] = url;
  }
  return {
    hotline: dto.hotline || SITE.hotline,
    hotlineHref: dto.hotline ? telHref(dto.hotline) : SITE.hotlineHref,
    whatsapp: dto.whatsapp,
    whatsappUrl: dto.whatsappUrl || SITE.social.whatsapp,
    email: dto.email || SITE.email,
    address: dto.address ? addressLines(dto.address) : [...SITE.address],
    openingHours: dto.openingHours.filter((h) => h.days).map((h) => ({ days: h.days ?? "", hours: h.hours ?? "" })),
    paymentMethods: dto.paymentMethods,
    social,
    usdToCdf: Number(dto.usdToCdf),
    newsletterDiscount: dto.newsletterDiscount,
    shipping: {
      freeThreshold: dto.shipping.freeThreshold === null ? null : Number(dto.shipping.freeThreshold),
      flatFee: Number(dto.shipping.flatFee),
    },
  };
}

/** Valeurs de repli (config statique) affichées pendant le chargement. */
export const FALLBACK_SETTINGS: SiteSettings = {
  hotline: SITE.hotline,
  hotlineHref: SITE.hotlineHref,
  whatsapp: "",
  whatsappUrl: SITE.social.whatsapp,
  email: SITE.email,
  address: [...SITE.address],
  openingHours: SITE.openingHours.map((h) => ({ ...h })),
  paymentMethods: [...SITE.paymentMethods],
  social: { facebook: SITE.social.facebook, instagram: SITE.social.instagram, x: SITE.social.twitter, youtube: SITE.social.youtube },
  usdToCdf: SITE.usdToCdf,
  newsletterDiscount: SITE.newsletterDiscount,
  shipping: { ...SITE.shipping },
};
