import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { Category } from "../types";
import { toCategory, type CategoryDto } from "./categories.mapper";

export const categoriesService = {
  async list(): Promise<Category[]> {
    return (await api.get<CategoryDto[]>(ENDPOINTS.categories.list)).map(toCategory);
  },
  async detail(slug: string): Promise<Category> {
    return toCategory(await api.get<CategoryDto>(ENDPOINTS.categories.detail(slug)));
  },
};
