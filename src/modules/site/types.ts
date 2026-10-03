export interface OpeningHours {
  days: string;
  hours: string;
}

export type SocialNetwork = "facebook" | "instagram" | "tiktok" | "x" | "youtube" | "linkedin";

/** Réglages publics de la boutique (`GET /settings/public/`). */
export interface SiteSettings {
  hotline: string;
  hotlineHref: string;
  whatsapp: string;
  whatsappUrl: string;
  email: string;
  /** Adresse sur deux lignes (rue, ville) */
  address: string[];
  openingHours: OpeningHours[];
  /** Codes API : orange_money, airtel_money, mpesa, cash… */
  paymentMethods: string[];
  social: Partial<Record<SocialNetwork, string>>;
  usdToCdf: number;
  /** Remise offerte à l'inscription newsletter (%) */
  newsletterDiscount: number;
  shipping: { freeThreshold: number | null; flatFee: number };
}

/** Libellé et pastille de chaque moyen de paiement (codes de l'API). */
export const PAYMENT_METHODS: Record<string, { label: string; cls: string }> = {
  orange_money: { label: "Orange Money", cls: "bg-[#FF7900] text-white" },
  airtel_money: { label: "Airtel Money", cls: "bg-[#E40000] text-white" },
  mpesa: { label: "M-Pesa", cls: "bg-[#2AAE4A] text-white" },
  cash: { label: "Cash", cls: "bg-ink-dark text-white" },
  card: { label: "Carte bancaire", cls: "bg-info text-white" },
};

export const paymentMethod = (code: string) => PAYMENT_METHODS[code] ?? { label: code, cls: "bg-chip text-ink" };
