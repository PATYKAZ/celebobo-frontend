import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { MOCK_CATEGORIES } from "../mocks/categories";
import { recountCategories } from "@/modules/admin/categories/services/recount";
import type { Category } from "../types";

export const categoriesService = {
  list(): Promise<Category[]> {
    if (env.USE_MOCKS) {
      // Boutique : seules les catégories actives, triées, avec le compte des produits visibles.
      return mockResponse(() => {
        recountCategories(true);
        return MOCK_CATEGORIES.filter((c) => c.active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }, 200);
    }
    return api.get<Category[]>(ENDPOINTS.categories.list);
  },
  async detail(id: number): Promise<Category> {
    if (env.USE_MOCKS) {
      const c = MOCK_CATEGORIES.find((x) => x.id === id && x.active !== false);
      if (!c) throw new ApiError(404, "Catégorie introuvable");
      return mockResponse(c, 200);
    }
    return api.get<Category>(ENDPOINTS.categories.detail(id));
  },
};
