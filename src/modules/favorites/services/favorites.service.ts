import { ENDPOINTS } from "@/config/endpoints";
import { api, type Paginated } from "@/shared/lib/api";
import { toProduct, type ProductCardDto } from "@/modules/products/services/products.mapper";
import type { Product } from "@/modules/products/types";

/** Taille de page maximale acceptée par l'API pour les favoris. */
export const FAVORITES_PAGE_SIZE = 48;

export const favoritesService = {
  async list(page = 1): Promise<Paginated<Product>> {
    return api.page<ProductCardDto, Product>(ENDPOINTS.favorites.list, { params: { page, pageSize: FAVORITES_PAGE_SIZE } }, toProduct);
  },

  /** Identifiants seuls : de quoi colorer les cœurs de toutes les cartes en une petite requête. */
  async ids(): Promise<number[]> {
    return (await api.get<{ ids: number[] }>(ENDPOINTS.favorites.ids)).ids;
  },

  async add(productId: number): Promise<void> {
    await api.post(ENDPOINTS.favorites.list, { productId });
  },

  async remove(productId: number): Promise<void> {
    await api.delete(ENDPOINTS.favorites.remove(productId));
  },
};
