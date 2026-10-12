import type { Category } from "../types";

/** Catégorie de l'API (après camelCase). */
export interface CategoryDto {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  productsCount: number;
  seoTitle?: string;
  seoDescription?: string;
  parent?: { id: number; slug: string; name: string } | null;
  /** catégories principales seulement (`GET /categories/`) */
  children?: CategoryDto[];
}

export function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    description: dto.description || null,
    image: dto.image || null,
    productsCount: dto.productsCount,
    icon: dto.icon,
    seoTitle: dto.seoTitle || null,
    seoDescription: dto.seoDescription || null,
    parent: dto.parent ?? null,
    children: (dto.children ?? []).map(toCategory),
  };
}

/** Arbre → liste : chaque catégorie principale suivie de ses sous-catégories. */
export const flattenCategories = (tree: Category[]): Category[] => tree.flatMap((c) => [c, ...c.children]);

/** Libellé d'une catégorie dans une liste déroulante : sous-catégories en retrait. */
export const categoryOptionLabel = (c: Pick<Category, "name" | "parent">) => (c.parent ? `\u00a0\u00a0\u21b3 ${c.name}` : c.name);
