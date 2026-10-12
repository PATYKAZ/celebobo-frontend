import type { SentUpload } from "@/shared/lib/api";
import { buildHomeContent } from "@/modules/home/content";

/** Bannière de l'accueil (`/bo/banners/`). */
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
  /** hero, hero_mini, hero_side, deal_side, showcase:<catégorie>, column:<catégorie> */
  placement: string;
  productId: number | null;
  /** produit rattaché (nom, image, prix), null sinon */
  product: { id: number; slug: string; name: string; image: string } | null;
  eyebrow: string;
  tone: BannerTone;
}

export type BannerTone = "light" | "dark";

/** Où mène la bannière : un produit (son prix s'affiche), une catégorie, une page du site ou une adresse libre. */
export type BannerLinkKind = "product" | "category" | "page" | "url";

export interface BannerFormValues {
  placement: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  tone: BannerTone;
  linkKind: BannerLinkKind;
  /** slug de la catégorie, chemin de la page ou adresse libre */
  linkTarget: string;
  productId: number | null;
  /** nom affiché du produit choisi */
  productName: string;
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

export const emptyBanner = (placement: string): BannerFormValues => ({
  placement,
  title: "",
  subtitle: "",
  eyebrow: "",
  tone: "dark",
  // petits emplacements : un produit (vrai prix) ; carrousel : une catégorie
  linkKind: placement === "hero" ? "category" : "product",
  linkTarget: "",
  productId: null,
  productName: "",
  linkLabel: "",
  isActive: true,
  startsAt: "",
  endsAt: "",
});

/** Emplacement de l'accueil : où il se trouve, combien de bannières s'y affichent, format d'image conseillé. */
export interface BannerSlot {
  value: string;
  label: string;
  where: string;
  /** nombre affiché sur l'accueil (les suivantes attendent leur tour) */
  shown: number | null;
  /** classe Tailwind du format de l'aperçu */
  aspect: string;
  size: string;
}

/** Bloc catégorie de l'accueil (section du back-office, ou bloc par défaut). */
export interface SlotSection {
  kind: "showcase" | "column";
  slug: string;
  title: string;
}

/**
 * Emplacements : fixes, puis un par bloc et par colonne catégorie de l'accueil. `sections` : blocs du back-office
 * (Blocs de l'accueil) ; vide = blocs par défaut de l'accueil.
 */
export function bannerSlots(categoryName: (slug: string) => string, sections: SlotSection[] = []): BannerSlot[] {
  const home = buildHomeContent();
  const blocks: SlotSection[] = sections.length
    ? sections
    : [
        ...home.showcases.map((s) => ({ kind: "showcase" as const, slug: s.categorySlug, title: s.title })),
        ...home.columns.map((c) => ({ kind: "column" as const, slug: c.categorySlug, title: categoryName(c.categorySlug) })),
      ];
  return [
    { value: "hero", label: "Carrousel", where: "Grand visuel défilant en haut de l'accueil.", shown: null, aspect: "aspect-45/16", size: "1800 × 640 px" },
    { value: "hero_mini", label: "Sous le carrousel", where: "Deux petites bannières sous le carrousel.", shown: 2, aspect: "aspect-[8/3]", size: "960 × 360 px" },
    { value: "hero_side", label: "À droite du carrousel", where: "Deux cartes à droite du carrousel (sous le carrousel sur mobile).", shown: 2, aspect: "aspect-[10/7]", size: "900 × 630 px" },
    { value: "deal_side", label: "À côté de l'offre du jour", where: "Trois cartes à côté du bloc « Offres du jour ».", shown: 3, aspect: "aspect-[7/4]", size: "840 × 480 px" },
    ...blocks.map((b) =>
      b.kind === "showcase"
        ? { value: `showcase:${b.slug}`, label: `Bloc « ${b.title} »`, where: `Bannière du bloc « ${b.title} ».`, shown: 1, aspect: "aspect-[3/1]", size: "1500 × 500 px" }
        : { value: `column:${b.slug}`, label: `Colonne « ${b.title} »`, where: `Bannière de la colonne « ${b.title} ».`, shown: 1, aspect: "aspect-[2/1]", size: "900 × 450 px" },
    ),
  ];
}

export type BannerStatus = "live" | "scheduled" | "expired" | "off";

export function bannerStatus(b: Pick<AdminBanner, "isActive" | "startsAt" | "endsAt">, now = Date.now()): BannerStatus {
  if (!b.isActive) return "off";
  if (b.startsAt && new Date(b.startsAt).getTime() > now) return "scheduled";
  if (b.endsAt && new Date(b.endsAt).getTime() <= now) return "expired";
  return "live";
}
