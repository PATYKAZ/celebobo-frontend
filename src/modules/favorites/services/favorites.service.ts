import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { toProduct, type ProductCardDto } from "@/modules/products/services/products.mapper";
import type { Product } from "@/modules/products/types";

export const favoritesService = {
  async list(): Promise<Product[]> {
    return (await api.get<ProductCardDto[]>(ENDPOINTS.favorites.list)).map(toProduct);
  },

  async add(productId: number): Promise<void> {
    await api.post(ENDPOINTS.favorites.list, { productId });
  },

  async remove(productId: number): Promise<void> {
    await api.delete(ENDPOINTS.favorites.remove(productId));
  },
};
