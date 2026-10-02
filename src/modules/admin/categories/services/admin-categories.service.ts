import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { getActor, logAudit } from "@/shared/mock-db/selectors";
import { can } from "@/modules/auth/permissions";
import { MOCK_CATEGORIES } from "@/modules/categories/mocks/categories";
import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import type { AdminCategory, CategoryFormValues, CategoryImageValue } from "../types";
import { recountCategories } from "./recount";

const guard = () => {
  if (!can(getActor(), "categories.manage")) throw new ApiError(403, "Votre rôle ne permet pas de gérer les catégories.");
};
const all = () => MOCK_CATEGORIES as AdminCategory[];
const sorted = () => [...all()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const find = (id: number) => {
  const c = all().find((x) => x.id === id);
  if (!c) throw new ApiError(404, "Catégorie introuvable");
  return c;
};
const nameTaken = (name: string, exceptId?: number) => all().some((c) => c.id !== exceptId && c.name.trim().toLowerCase() === name.trim().toLowerCase());

function toFormData(v: CategoryFormValues, image: CategoryImageValue): FormData {
  const fd = new FormData();
  fd.append("name", v.name);
  fd.append("description", v.description);
  fd.append("icon", v.icon);
  fd.append("active", String(v.active));
  if (image.file) fd.append("image", image.file);
  return fd;
}

export const adminCategoriesService = {
  /** Toutes les catégories (actives ET inactives), triées par `order`. */
  list(): Promise<AdminCategory[]> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        recountCategories();
        return sorted();
      }, 250);
    }
    return api.get<AdminCategory[]>(ENDPOINTS.admin.categories.list);
  },

  async create(v: CategoryFormValues, image: CategoryImageValue): Promise<AdminCategory> {
    if (env.USE_MOCKS) {
      guard();
      if (nameTaken(v.name)) throw new ApiError(400, "Ce nom existe déjà", { name: ["Une catégorie porte déjà ce nom."] });
      const c: AdminCategory = {
        id: Math.max(0, ...all().map((x) => x.id)) + 1,
        name: v.name.trim(),
        description: v.description.trim() || null,
        image: image.url,
        productsCount: 0,
        icon: v.icon,
        active: v.active,
        order: Math.max(0, ...all().map((x) => x.order ?? 0)) + 1,
      };
      MOCK_CATEGORIES.push(c);
      logAudit({ action: "Catégorie créée", entity: "catégorie", entityId: c.id, summary: `Création : « ${c.name} »` });
      return mockResponse(c, 450);
    }
    return api.post<AdminCategory>(ENDPOINTS.admin.categories.list, toFormData(v, image));
  },

  async update(id: number, v: CategoryFormValues, image: CategoryImageValue): Promise<AdminCategory> {
    if (env.USE_MOCKS) {
      guard();
      const c = find(id);
      if (nameTaken(v.name, id)) throw new ApiError(400, "Ce nom existe déjà", { name: ["Une catégorie porte déjà ce nom."] });
      const renamed = c.name !== v.name.trim();
      Object.assign(c, { name: v.name.trim(), description: v.description.trim() || null, icon: v.icon, active: v.active, image: image.url });
      if (renamed) for (const p of MOCK_PRODUCTS) if (p.categoryId === id) p.category = c.name;
      logAudit({ action: "Catégorie modifiée", entity: "catégorie", entityId: id, summary: `Modification : « ${c.name} »` });
      return mockResponse(c, 450);
    }
    return api.patch<AdminCategory>(ENDPOINTS.admin.categories.detail(id), toFormData(v, image));
  },

  async setActive(id: number, active: boolean): Promise<AdminCategory> {
    if (env.USE_MOCKS) {
      guard();
      const c = find(id);
      c.active = active;
      logAudit({ action: active ? "Catégorie activée" : "Catégorie désactivée", entity: "catégorie", entityId: id, summary: `« ${c.name} » ${active ? "visible" : "masquée"} en boutique` });
      return mockResponse(c, 250);
    }
    return api.patch<AdminCategory>(ENDPOINTS.admin.categories.detail(id), { active });
  },

  /** Déplace d'un cran (échange l'ordre avec la voisine). */
  async move(id: number, dir: "up" | "down"): Promise<AdminCategory[]> {
    if (env.USE_MOCKS) {
      guard();
      const list = sorted();
      const i = list.findIndex((c) => c.id === id);
      const j = dir === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= list.length) return mockResponse(list, 100);
      [list[i], list[j]] = [list[j], list[i]];
      list.forEach((c, k) => (c.order = k + 1));
      return mockResponse(sorted(), 200);
    }
    const ids = sorted().map((c) => c.id);
    return api.post<AdminCategory[]>(ENDPOINTS.admin.categories.reorder, { id, direction: dir, ids });
  },

  /**
   * Supprime une catégorie. Refusé (409) tant qu'elle contient des produits,
   * sauf si `moveTo` est fourni : les produits sont alors réaffectés avant suppression.
   */
  async remove(id: number, moveTo?: number | null): Promise<void> {
    if (env.USE_MOCKS) {
      guard();
      const c = find(id);
      const inCat = MOCK_PRODUCTS.filter((p) => p.categoryId === id && !p.deletedAt);
      if (inCat.length && !moveTo) throw new ApiError(409, `Cette catégorie contient ${inCat.length} produit(s).`, { productsCount: inCat.length });
      if (moveTo) {
        const dest = find(moveTo);
        for (const p of MOCK_PRODUCTS) if (p.categoryId === id) Object.assign(p, { categoryId: dest.id, category: dest.name });
      }
      MOCK_CATEGORIES.splice(MOCK_CATEGORIES.indexOf(c), 1);
      sorted().forEach((x, k) => (x.order = k + 1));
      logAudit({ action: "Catégorie supprimée", entity: "catégorie", entityId: id, summary: `Suppression : « ${c.name} »${moveTo ? ` (produits → catégorie #${moveTo})` : ""}` });
      return mockResponse(undefined, 400);
    }
    await api.delete(ENDPOINTS.admin.categories.detail(id), { params: moveTo ? { moveTo } : undefined });
  },
};
