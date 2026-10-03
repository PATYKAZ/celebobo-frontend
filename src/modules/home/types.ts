import type { Product } from "@/modules/products/types";

export interface HeroSlide {
  id: number;
  image: string;
  /** Alignement du contenu : thème clair/sombre pour la lisibilité */
  tone: "light" | "dark";
  eyebrow?: string;
  titleLines: { text: string; className?: string }[];
  text?: string;
  bullets?: string[];
  cta: { label: string; href: string; variant: "primary" | "dark" | "white" };
  overlay: string;
}

export interface MiniBanner {
  id: number;
  image: string;
  tone: "light" | "dark";
  lines: string;
  highlight?: string;
  highlightClass?: string;
  sub?: string;
  cta?: { label: string; href: string };
  overlay: string;
}

export interface PromoCard {
  id: number;
  image: string;
  tone: "light" | "dark";
  eyebrow: string;
  title: string;
  from?: string;
  price?: string;
  cta: { label: string; href: string };
  overlay: string;
}

export interface Brand {
  name: string;
  /** classes Tailwind du wordmark */
  className: string;
  color: string;
}

export interface SideBanner {
  id: number;
  image: string;
  eyebrow: string;
  title: string;
  href: string;
}

export interface EditorialCard {
  id: number;
  image: string;
  title: string;
  text: string;
  href: string;
}

export interface ShowcaseSubCategory {
  name: string;
  count: number;
  image: string;
  href: string;
}

export interface ShowcaseConfig {
  title: string;
  categorySlug: string;
  viewAllHref: string;
  banner: {
    image: string;
    title: string[];
    text: string;
    cta: string;
    price?: string;
    tone: "light" | "dark";
    overlay: string;
  };
  subCategories: ShowcaseSubCategory[];
}

export interface CategoryColumn {
  title: string;
  href: string;
  banner: { image: string; lines: string[]; tone: "light" | "dark"; overlay: string };
  items: { name: string; count: number; image: string; href: string }[];
}

/** Produits de l'accueil, servis en un seul appel par l'API (`GET /home/`). */
export interface HomeCatalog {
  deals: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  /** slug de catégorie → produits */
  byCategory: Record<string, Product[]>;
}

export interface HomeContent {
  /** null tant que l'API n'a pas répondu (le contenu éditorial s'affiche déjà) */
  catalog: HomeCatalog | null;
  slides: HeroSlide[];
  miniBanners: MiniBanner[];
  promoCards: PromoCard[];
  brands: Brand[];
  sideBanners: SideBanner[];
  editorial: EditorialCard[];
  showcases: ShowcaseConfig[];
  columns: CategoryColumn[];
  /** Date de fin des offres du jour (ISO) */
  dealEndsAt: string;
  dealSold: { sold: number; total: number };
  seo: { title: string; paragraphs: string[] };
}
