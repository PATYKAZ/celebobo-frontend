import { ENDPOINTS } from "@/config/endpoints";
import { api, uploadMedia } from "@/shared/lib/api";
import type { AdminCategory, CategoryFormValues, CategoryImageValue } from "../types";
import { toAdminCategory, type AdminCategoryDto } from "./admin-categories.mapper";

const { categories } = ENDPOINTS.admin;

/** Corps commun création / modification ; l'image n'est envoyée que si un nouveau fichier a été choisi. */
async function toPayload(v: CategoryFormValues, image: CategoryImageValue) {
  const imageId = image.file ? (await uploadMedia(image.file, "category_image")).id : undefined;
  return { name: v.name.trim(), description: v.description.trim(), icon: v.icon, isActive: v.active, imageId };
}

export const adminCategoriesService = {
  /** Toutes les catégories (actives ET inactives), triées par position. */
  async list(): Promise<AdminCategory[]> {
    return (await api.get<AdminCategoryDto[]>(categories.list)).map(toAdminCategory);
  },

  async create(v: CategoryFormValues, image: CategoryImageValue): Promise<AdminCategory> {
    return toAdminCategory(await api.post<AdminCategoryDto>(categories.list, await toPayload(v, image)));
  },

  async update(id: number, v: CategoryFormValues, image: CategoryImageValue): Promise<AdminCategory> {
    return toAdminCategory(await api.patch<AdminCategoryDto>(categories.detail(id), await toPayload(v, image)));
  },

  async setActive(id: number, active: boolean): Promise<AdminCategory> {
    return toAdminCategory(await api.patch<AdminCategoryDto>(categories.detail(id), { isActive: active }));
  },

  /** Déplace d'un cran : l'API reçoit l'ordre complet des ids. */
  async move(id: number, dir: "up" | "down"): Promise<AdminCategory[]> {
    const ids = (await adminCategoriesService.list()).map((c) => c.id);
    const i = ids.indexOf(id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < ids.length) [ids[i], ids[j]] = [ids[j], ids[i]];
    return (await api.post<AdminCategoryDto[]>(categories.reorder, { ids })).map(toAdminCategory);
  },

  /**
   * Supprime une catégorie. Refusé tant qu'elle contient des produits,
   * sauf si `moveTo` est fourni : les produits sont alors réaffectés avant suppression.
   */
  async remove(id: number, moveTo?: number | null): Promise<void> {
    await api.delete(categories.detail(id), { params: moveTo ? { moveTo } : undefined });
  },
};
