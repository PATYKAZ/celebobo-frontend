import { MOCK_CATEGORIES } from "@/modules/categories/mocks/categories";
import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";

/** Un produit est visible en boutique s'il n'est ni en corbeille ni désactivé. */
export const isVisibleProduct = (p: { deletedAt?: string | null; isActive?: boolean }) => !p.deletedAt && p.isActive !== false;

/**
 * Recalcule `productsCount` de chaque catégorie (produits non supprimés).
 * `visibleOnly` : ne compte que les produits visibles en boutique (liste publique).
 */
export function recountCategories(visibleOnly = false) {
  for (const c of MOCK_CATEGORIES) {
    c.productsCount = MOCK_PRODUCTS.filter((p) => p.categoryId === c.id && (visibleOnly ? isVisibleProduct(p) : !p.deletedAt)).length;
  }
}
