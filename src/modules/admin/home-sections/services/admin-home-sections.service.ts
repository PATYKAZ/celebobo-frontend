import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { HomeSection, SectionFormValues } from "../types";

const { homeSections } = ENDPOINTS.admin;

const payload = (v: SectionFormValues) => ({ kind: v.kind, categoryId: v.categoryId, title: v.title.trim(), isActive: v.isActive });

export const adminHomeSectionsService = {
  /** Toutes les sections (actives ou non), dans l'ordre de l'accueil. */
  async list(): Promise<HomeSection[]> {
    return (await api.get<HomeSection[]>(homeSections.list)).sort((a, b) => a.position - b.position || a.id - b.id);
  },
  async create(v: SectionFormValues): Promise<HomeSection> {
    return api.post<HomeSection>(homeSections.list, payload(v));
  },
  async update(id: number, v: SectionFormValues): Promise<HomeSection> {
    return api.patch<HomeSection>(homeSections.detail(id), payload(v));
  },
  async setActive(id: number, isActive: boolean): Promise<HomeSection> {
    return api.patch<HomeSection>(homeSections.detail(id), { isActive });
  },
  async reorder(ids: number[]): Promise<void> {
    await api.post(homeSections.reorder, { ids });
  },
  async remove(id: number): Promise<void> {
    await api.delete(homeSections.detail(id));
  },
};
