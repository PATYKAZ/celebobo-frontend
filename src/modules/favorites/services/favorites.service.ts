import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse, type Paginated } from "@/shared/lib/api";
import { productsService } from "@/modules/products/services/products.service";
import type { Product } from "@/modules/products/types";

export const favoritesService = {
  /** Produits favoris de l'utilisateur. En mock : filtre par ids locaux. */
  async list(localIds: number[]): Promise<Product[]> {
    if (env.USE_MOCKS) {
      if (!localIds.length) return mockResponse([], 250);
      const res = await productsService.list({ ids: localIds, pageSize: 100 });
      return res.results;
    }
    const res = await api.get<Paginated<Product> | Product[]>(ENDPOINTS.favorites.list);
    return Array.isArray(res) ? res : res.results;
  },

  /** Bascule un favori. Retourne l'état final. */
  async toggle(productId: number): Promise<{ isFavorite: boolean }> {
    if (env.USE_MOCKS) return { isFavorite: true };
    return api.post<{ isFavorite: boolean }>(ENDPOINTS.favorites.toggle(productId));
  },
};
