import type { AdminCategory } from "../types";

/** Catégorie du back-office (après camelCase). */
export interface AdminCategoryDto {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  isActive: boolean;
  position: number;
  productsCount: number;
}

export const toAdminCategory = (dto: AdminCategoryDto): AdminCategory => ({
  id: dto.id,
  slug: dto.slug,
  name: dto.name,
  description: dto.description || null,
  image: dto.image || null,
  productsCount: dto.productsCount,
  icon: dto.icon,
  active: dto.isActive,
  order: dto.position,
});
