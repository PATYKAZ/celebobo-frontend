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
  };
}
