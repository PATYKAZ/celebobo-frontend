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
  /** délai de retour après livraison, en jours (0 = pas de retour) */
  returnDays: number;
  /** service client joignable jour et nuit ; sinon la boutique affiche les horaires */
  supportAlwaysOpen: boolean;
  /** programmes de fidélité : chacun ne s'affiche que s'il est activé (ou, pour l'app, si un lien existe) */
  programmes: Programmes;
}

export interface Programmes {
  /** Celebobo Plus : livraison offerte sans minimum dans les zones membres */
  membership: { enabled: boolean; monthlyPrice: number; yearlyPrice: number; trialDays: number; reminderDays: number };
  /** Cagnotte : `percent` du montant des produits, utilisable jusqu'à `maxShare` % d'une commande dès `minBalance` */
  cashback: { enabled: boolean; percent: number; maxShare: number; minBalance: number; validityMonths: number; /** réservée aux membres Plus */ membersOnly: boolean };
  /** liens des applications (vides = pas de bloc) */
  appLinks: { appStore: string; playStore: string };
}

export const NO_PROGRAMMES: Programmes = {
  membership: { enabled: false, monthlyPrice: 0, yearlyPrice: 0, trialDays: 0, reminderDays: 0 },
  cashback: { enabled: false, percent: 0, maxShare: 0, minBalance: 0, validityMonths: 0, membersOnly: true },
  appLinks: { appStore: "", playStore: "" },
};

/** « 7 jours », « 1 jour ». */
export const returnPeriod = (days: number) => `${days} jour${days > 1 ? "s" : ""}`;

/** « Service client 24/7 » seulement si le service répond jour et nuit. */
export const supportLabel = (s: Pick<SiteSettings, "supportAlwaysOpen">) => (s.supportAlwaysOpen ? "Service client 24/7" : "Service client");

/** Première ligne d'horaires (« Lundi – Vendredi · 08h00 – 19h00 »), sauf service 24/7. */
export const supportHours = (s: Pick<SiteSettings, "supportAlwaysOpen" | "openingHours">) =>
  s.supportAlwaysOpen || !s.openingHours[0] ? null : `${s.openingHours[0].days} · ${s.openingHours[0].hours}`;

/** Libellé et pastille de chaque moyen de paiement (codes de l'API). */
export const PAYMENT_METHODS: Record<string, { label: string; cls: string }> = {
  orange_money: { label: "Orange Money", cls: "bg-[#FF7900] text-on-light" },
  airtel_money: { label: "Airtel Money", cls: "bg-[#E40000] text-white" },
  mpesa: { label: "M-Pesa", cls: "bg-[#2AAE4A] text-on-light" },
  cash: { label: "Cash", cls: "bg-ink-dark text-white" },
  card: { label: "Carte bancaire", cls: "bg-info text-white" },
};

export const paymentMethod = (code: string) => PAYMENT_METHODS[code] ?? { label: code, cls: "bg-chip text-ink" };
