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
  /** Titre / description pour les moteurs de recherche (vides → nom / description). */
  seoTitle?: string | null;
  seoDescription?: string | null;
  /** catégorie parente (sous-catégorie), null pour une catégorie principale */
  parent: CategoryRef | null;
  /** sous-catégories (catégorie principale) ; le nombre d'articles du parent les inclut */
  children: Category[];
}

export interface CategoryRef {
  id: number;
  slug: string;
  name: string;
}
