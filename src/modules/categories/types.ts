/** Catégorie de la boutique. */
export interface Category {
  id: number;
  /** Identifiant d'URL (`/categorie/{slug}`). */
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  productsCount: number;
  /** Nom d'icône (mobile, monitor, headphone…) — cf. CategoryIcon. */
  icon?: string;
  /** Position d'affichage (admin : réordonnable) */
  order?: number;
  /** Visible en boutique */
  active?: boolean;
}
