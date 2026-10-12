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

export interface Brand {
  name: string;
  /** autres noms qui désignent la marque dans les noms de produits (iPhone → Apple) */
  aliases?: string[];
  /** classes Tailwind du wordmark */
  className: string;
  color: string;
}

/**
 * Bloc catégorie : la bannière présente le produit le plus vendu de la catégorie (vrai nom, vrai prix),
 * la grille montre de vraies catégories avec leur nombre d'articles.
 */
export interface ShowcaseConfig {
  title: string;
  categorySlug: string;
  viewAllHref: string;
  /** catégories affichées dans la grille (slugs), dans l'ordre */
  related: string[];
}

/** Colonne catégorie : visuel et nombre d'articles de la catégorie, puis ses 4 produits les plus vendus. */
export interface CategoryColumn {
  categorySlug: string;
}

/** Produits de l'accueil, servis en un seul appel par l'API (`GET /home/`). */
export interface HomeCatalog {
  deals: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  /** slug de catégorie → produits */
  byCategory: Record<string, Product[]>;
}

/** Produits réels répartis entre les emplacements de l'accueil, sans doublon. */
export interface HomePicks {
  /** offre du jour : promotion la plus vendue */
  deal: Product | null;
  /** 2 mini-bannières sous le carrousel : promotions suivantes */
  minis: Product[];
  /** 2 cartes à droite du carrousel : meilleures ventes */
  promos: Product[];
  /** 3 cartes à côté de l'offre du jour */
  side: Product[];
}

export interface HomeContent {
  /** null tant que l'API n'a pas répondu (le contenu éditorial s'affiche déjà) */
  catalog: HomeCatalog | null;
  slides: HeroSlide[];
  /** Produits mis en avant (offre, mini-bannières, cartes promo, cartes latérales) ; null tant que l'API n'a pas répondu */
  picks: HomePicks | null;
  /** Marques présentes dans le catalogue ; null tant que l'API n'a pas répondu */
  brands: Brand[] | null;
  showcases: ShowcaseConfig[];
  columns: CategoryColumn[];
  seo: { title: string; paragraphs: string[] };
}
