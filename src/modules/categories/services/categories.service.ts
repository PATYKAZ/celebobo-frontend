import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { MOCK_CATEGORIES } from "../mocks/categories";
import type { Category } from "../types";

export const categoriesService = {
  list(): Promise<Category[]> {
    if (env.USE_MOCKS) return mockResponse(MOCK_CATEGORIES, 200);
    return api.get<Category[]>(ENDPOINTS.categories.list);
  },
  async detail(id: number): Promise<Category> {
    if (env.USE_MOCKS) {
      const c = MOCK_CATEGORIES.find((x) => x.id === id);
      if (!c) throw new ApiError(404, "Catégorie introuvable");
      return mockResponse(c, 200);
    }
    return api.get<Category>(ENDPOINTS.categories.detail(id));
  },
};
