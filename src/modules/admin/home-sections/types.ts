/** Grand bloc (bannière, sous-catégories, carrousel de produits) ou colonne (visuel et 4 produits). */
export type SectionKind = "showcase" | "column";

/** Bloc catégorie de l'accueil (`/bo/home-sections/`). */
export interface HomeSection {
  id: number;
  kind: SectionKind;
  categoryId: number;
  /** vide = nom de la catégorie */
  title: string;
  position: number;
  isActive: boolean;
}

export interface SectionFormValues {
  kind: SectionKind;
  categoryId: number | null;
  title: string;
  isActive: boolean;
}

export const SECTION_KINDS: { value: SectionKind; label: string; hint: string }[] = [
  { value: "showcase", label: "Grand bloc", hint: "Bannière, sous-catégories et carrousel des meilleures ventes, sur toute la largeur." },
  { value: "column", label: "Colonne", hint: "Visuel de la catégorie et ses 4 meilleures ventes ; les colonnes qui se suivent partagent une rangée (3 au plus)." },
];
