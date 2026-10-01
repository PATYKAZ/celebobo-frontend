/** shop.models.Category */
export interface Category {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  productsCount: number;
  /** Nom d'icône Iconsax (affichage sidebar) — dérivé côté front si absent. */
  icon?: string;
}
