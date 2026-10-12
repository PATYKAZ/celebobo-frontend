import { ENDPOINTS } from "@/config/endpoints";
import { api, uploadMedia } from "@/shared/lib/api";
import { categoryTree, type AdminCategory, type CategoryFormValues, type CategoryImageValue } from "../types";
import { toAdminCategory, type AdminCategoryDto } from "./admin-categories.mapper";

const { categories } = ENDPOINTS.admin;

/** Corps commun création / modification ; l'image n'est envoyée que si un nouveau fichier a été choisi. */
async function toPayload(v: CategoryFormValues, image: CategoryImageValue) {
  const imageId = image.file ? (await uploadMedia(image.file, "category_image")).id : undefined;
  return { name: v.name.trim(), description: v.description.trim(), icon: v.icon, isActive: v.active, parentId: v.parentId, seoTitle: v.seoTitle.trim(), seoDescription: v.seoDescription.trim(), imageId };
}

export const adminCategoriesService = {
  /** Toutes les catégories (actives ET inactives) : chaque principale suivie de ses sous-catégories. */
  async list(): Promise<AdminCategory[]> {
    return categoryTree((await api.get<AdminCategoryDto[]>(categories.list)).map(toAdminCategory));
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

  /**
   * Déplace d'un cran parmi ses sœurs (catégories principales entre elles, sous-catégories d'un même parent) :
   * l'API reçoit l'ordre complet des ids ; une principale emmène ses sous-catégories.
   */
  async move(id: number, dir: "up" | "down"): Promise<AdminCategory[]> {
    const tree = await adminCategoriesService.list();
    const me = tree.find((c) => c.id === id);
    if (!me) return tree;
    const siblings = tree.filter((c) => c.parentId === me.parentId);
    const i = siblings.findIndex((c) => c.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= siblings.length) return tree;
    [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
    const tops = me.parentId == null ? siblings : tree.filter((c) => c.parentId == null);
    const childrenOf = (top: AdminCategory) => (top.id === me.parentId ? siblings : tree.filter((c) => c.parentId === top.id));
    const ids = tops.flatMap((top) => [top.id, ...childrenOf(top).map((c) => c.id)]);
    return categoryTree((await api.post<AdminCategoryDto[]>(categories.reorder, { ids })).map(toAdminCategory));
  },

  /**
   * Supprime une catégorie. Refusé tant qu'elle contient des produits,
   * sauf si `moveTo` est fourni : les produits sont alors réaffectés avant suppression.
   */
  async remove(id: number, moveTo?: number | null): Promise<void> {
    await api.delete(categories.detail(id), { params: moveTo ? { moveTo } : undefined });
  },
};
