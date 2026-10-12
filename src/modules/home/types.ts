import type { Product, ProductVariant } from "@/modules/products/types";

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
  /** bannière rattachée à un produit : son vrai prix s'affiche */
  product?: Product | null;
}

/**
 * Visuel d'un emplacement de l'accueil : bannière du back-office (`GET /home/` banners, par emplacement) ou, à défaut,
 * carte d'un vrai produit. Avec un produit, le prix affiché et le lien sont ceux du produit.
 */
export interface HomeBanner {
  key: string;
  image: string;
  /** retour à la ligne = ligne du titre */
  title: string;
  subtitle: string;
  /** petit sur-titre (« Audio », « Nouveau ») */
  eyebrow: string;
  /** light : image claire, texte sombre ; dark : image sombre, texte clair */
  tone: "light" | "dark";
  href: string;
  cta: string;
  product: Product | null;
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

/**
 * Offre du jour. Programmée dans l'admin (`/bo/deals/`) : prix, fin, quantité et cadeau réels. Sans offre programmée,
 * la promotion la plus vendue du moment prend la place, sans compte à rebours ni quantité.
 */
export interface HomeDeal {
  /** null : simple promotion du catalogue, pas une offre programmée */
  id: number | null;
  product: Product;
  /** variante concernée (offre sur une seule variante), sinon null */
  variant: ProductVariant | null;
  dealPrice: number;
  regularPrice: number;
  endsAt: string | null;
  /** null = sans limite de quantité */
  quantity: number | null;
  sold: number | null;
  giftLabel: string;
}

/** Produits réels répartis entre les emplacements de l'accueil, sans doublon. */
export interface HomePicks {
  /** offre du jour programmée, sinon promotion la plus vendue */
  deal: HomeDeal | null;
  /** 2 mini-bannières sous le carrousel (`hero_mini`, sinon promotions suivantes) */
  minis: HomeBanner[];
  /** 2 cartes à droite du carrousel (`hero_side`, sinon meilleures ventes) */
  promos: HomeBanner[];
  /** 3 cartes à côté de l'offre du jour (`deal_side`, sinon promotions et meilleures ventes) */
  side: HomeBanner[];
}

export interface HomeContent {
  /** null tant que l'API n'a pas répondu (le contenu éditorial s'affiche déjà) */
  catalog: HomeCatalog | null;
  slides: HeroSlide[];
  /** Produits mis en avant (offre, mini-bannières, cartes promo, cartes latérales) ; null tant que l'API n'a pas répondu */
  picks: HomePicks | null;
  /** Bannières par emplacement (`showcase:<catégorie>`, `column:<catégorie>`…) ; null tant que l'API n'a pas répondu */
  placements: Record<string, HomeBanner[]> | null;
  /** Marques présentes dans le catalogue ; null tant que l'API n'a pas répondu */
  brands: Brand[] | null;
  showcases: ShowcaseConfig[];
  columns: CategoryColumn[];
  seo: { title: string; paragraphs: string[] };
}
