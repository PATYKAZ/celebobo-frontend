"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminProductsService } from "../services/admin-products.service";
import type { AdminProductListParams, ImageSlotValue, ProductFormValues } from "../types";

export const adminProductKeys = {
  all: ["admin", "products"] as const,
  list: (p: AdminProductListParams) => ["admin", "products", "list", p] as const,
  detail: (id: number) => ["admin", "products", "detail", id] as const,
};

export function useAdminProducts(params: AdminProductListParams) {
  return useQuery({ queryKey: adminProductKeys.list(params), queryFn: () => adminProductsService.list(params), placeholderData: keepPreviousData });
}

export function useAdminProduct(id: number | undefined) {
  return useQuery({ queryKey: adminProductKeys.detail(id ?? 0), queryFn: () => adminProductsService.detail(id as number), enabled: !!id });
}

export function useSaveProduct(id: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ values, images }: { values: ProductFormValues; images: ImageSlotValue[] }) => adminProductsService.save(id, values, images),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminProductKeys.all });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminProductsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminProductKeys.all });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
