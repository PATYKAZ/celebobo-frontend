"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminProductsService } from "../services/admin-products.service";
import type { AdminProductListParams, BulkAction, ImageSlotValue, ProductFormValues, StockAdjustInput } from "../types";

export const adminProductKeys = {
  all: ["admin", "products"] as const,
  list: (p: AdminProductListParams) => ["admin", "products", "list", p] as const,
  detail: (id: number) => ["admin", "products", "detail", id] as const,
  movements: (id: number) => ["admin", "products", "movements", id] as const,
  stats: (id: number) => ["admin", "products", "stats", id] as const,
  reviews: (id: number) => ["admin", "products", "reviews", id] as const,
};

/** Après une mutation catalogue : rafraîchit l'admin ET la boutique (listes, catégories). */
function useInvalidateCatalog() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminProductKeys.all });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
  };
}

export function useAdminProducts(params: AdminProductListParams, enabled = true) {
  return useQuery({ queryKey: adminProductKeys.list(params), queryFn: () => adminProductsService.list(params), placeholderData: keepPreviousData, enabled });
}

export function useAdminProduct(id: number | undefined) {
  return useQuery({ queryKey: adminProductKeys.detail(id ?? 0), queryFn: () => adminProductsService.detail(id as number), enabled: !!id });
}

export function useProductSalesStats(id: number | undefined) {
  return useQuery({ queryKey: adminProductKeys.stats(id ?? 0), queryFn: () => adminProductsService.salesStats(id as number), enabled: !!id });
}

export function useAdminProductReviews(id: number | undefined) {
  return useQuery({ queryKey: adminProductKeys.reviews(id ?? 0), queryFn: () => adminProductsService.reviews(id as number), enabled: !!id });
}

export function useStockMovements(id: number | undefined, enabled = true) {
  return useQuery({ queryKey: adminProductKeys.movements(id ?? 0), queryFn: () => adminProductsService.stockMovements(id as number), enabled: !!id && enabled });
}

export function useSaveProduct(id: number | null) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ values, images }: { values: ProductFormValues; images: ImageSlotValue[] }) => adminProductsService.save(id, values, images),
    onSuccess: invalidate,
  });
}

/** Mise à la corbeille (suppression douce). */
export function useTrashProducts() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (ids: number[]) => adminProductsService.trash(ids), onSuccess: invalidate });
}

/** Alias historique : `useDeleteProduct` = mise à la corbeille d'un produit. */
export function useDeleteProduct() {
  const trash = useTrashProducts();
  return { ...trash, mutate: (id: number, opts?: Parameters<typeof trash.mutate>[1]) => trash.mutate([id], opts) };
}

export function useRestoreProducts() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (ids: number[]) => adminProductsService.restore(ids), onSuccess: invalidate });
}

export function useBulkProducts() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: ({ ids, action }: { ids: number[]; action: BulkAction }) => adminProductsService.bulk(ids, action), onSuccess: invalidate });
}

export function useAdjustStock(productId: number) {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (input: StockAdjustInput) => adminProductsService.adjustStock(productId, input), onSuccess: invalidate });
}

/** Import CSV : simulation (`dryRun`) puis import réel ; seul l'import réel rafraîchit le catalogue. */
export function useImportProducts() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ file, dryRun }: { file: File; dryRun: boolean }) => adminProductsService.importCsv(file, dryRun),
    onSuccess: (summary) => {
      if (!summary.dryRun) invalidate();
    },
  });
}

export function useDuplicateProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (id: number) => adminProductsService.duplicate(id), onSuccess: invalidate });
}
