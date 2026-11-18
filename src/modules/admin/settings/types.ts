import type { OpeningHours, SocialNetwork } from "@/modules/site/types";

/** Réglages du site côté back-office (`GET /bo/settings/`). Tous les prix restent en USD ; le taux ne sert qu'à l'affichage. */
export interface AdminSiteSettings {
  usdToCdf: number;
  hotline: string;
  whatsapp: string;
  email: string;
  address: string;
  openingHours: OpeningHours[];
  paymentMethods: string[];
  social: Partial<Record<SocialNetwork, string>>;
  newsletterCode: string;
  newsletterDiscount: number;
  returnDays: number;
  supportAlwaysOpen: boolean;
}

/** Valeurs du formulaire (chaînes pour les champs). */
export interface SettingsFormValues {
  usdToCdf: string;
  hotline: string;
  whatsapp: string;
  email: string;
  address: string;
  openingHours: OpeningHours[];
  paymentMethods: string[];
  social: Partial<Record<SocialNetwork, string>>;
  newsletterCode: string;
  newsletterDiscount: string;
  returnDays: string;
  supportAlwaysOpen: boolean;
}

/** Tarification d'une zone : frais fixes, sur devis (le revendeur propose les frais), retrait sur place (gratuit). */
export type ZonePricing = "flat" | "quote" | "pickup";

export const ZONE_PRICING: { value: ZonePricing; label: string; hint: string }[] = [
  { value: "flat", label: "Tarif fixe", hint: "Frais de la zone, offerts dès le seuil." },
  { value: "quote", label: "Sur devis", hint: "Commande sans frais ; le revendeur propose les frais dans la discussion, le client accepte ou annule sans frais." },
  { value: "pickup", label: "Retrait sur place", hint: "Gratuit ; le client choisit le retrait à la commande. Une seule zone de ce type." },
];

/** Zone de livraison (`/bo/shipping-zones/`). */
export interface AdminShippingZone {
  id: number;
  name: string;
  cities: string[];
  fee: number;
  freeThreshold: number | null;
  deliveryEstimate: string;
  isDefault: boolean;
  isActive: boolean;
  position: number;
  /** livraison offerte aux membres Celebobo Plus, sans minimum */
  memberFreeShipping: boolean;
  pricing: ZonePricing;
  /** Adresse du point de retrait (zone « retrait sur place ») */
  pickupAddress: string;
}

export interface ZoneFormValues {
  name: string;
  /** Une ville par ligne */
  cities: string;
  fee: string;
  freeThreshold: string;
  deliveryEstimate: string;
  isDefault: boolean;
  isActive: boolean;
  memberFreeShipping: boolean;
  pricing: ZonePricing;
  pickupAddress: string;
}

export const EMPTY_ZONE: ZoneFormValues = { name: "", cities: "", fee: "", freeThreshold: "", deliveryEstimate: "", isDefault: false, isActive: true, memberFreeShipping: false, pricing: "flat", pickupAddress: "" };

export const SOCIAL_NETWORKS: { key: SocialNetwork; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X (Twitter)" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
];
