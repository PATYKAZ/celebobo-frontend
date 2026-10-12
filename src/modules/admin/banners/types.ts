import type { SentUpload } from "@/shared/lib/api";

/** Bannière du carrousel de l'accueil (`/bo/banners/`). */
export interface AdminBanner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  linkUrl: string;
  linkLabel: string;
  position: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

/** Où mène le bouton : un produit, une catégorie, une page du site ou une adresse libre. */
export type BannerLinkKind = "product" | "category" | "page" | "url";

export interface BannerFormValues {
  title: string;
  subtitle: string;
  linkKind: BannerLinkKind;
  /** slug du produit ou de la catégorie, chemin de la page, ou adresse libre */
  linkTarget: string;
  /** nom affiché du produit choisi (le lien ne garde que le slug) */
  linkProductName: string;
  linkLabel: string;
  isActive: boolean;
  /** `yyyy-mm-ddThh:mm` (champ datetime-local), vide = sans limite */
  startsAt: string;
  endsAt: string;
}

/** Image : celle déjà publiée, ou un nouveau fichier envoyé à Cloudinary dès son choix. */
export interface BannerImageValue {
  url: string | null;
  file?: File | null;
  upload?: Promise<SentUpload>;
}

export const EMPTY_BANNER: BannerFormValues = {
  title: "",
  subtitle: "",
  linkKind: "category",
  linkTarget: "",
  linkProductName: "",
  linkLabel: "Découvrir",
  isActive: true,
  startsAt: "",
  endsAt: "",
};

export type BannerStatus = "live" | "scheduled" | "expired" | "off";

export function bannerStatus(b: Pick<AdminBanner, "isActive" | "startsAt" | "endsAt">, now = Date.now()): BannerStatus {
  if (!b.isActive) return "off";
  if (b.startsAt && new Date(b.startsAt).getTime() > now) return "scheduled";
  if (b.endsAt && new Date(b.endsAt).getTime() <= now) return "expired";
  return "live";
}
