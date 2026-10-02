"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCategoriesService } from "../services/admin-categories.service";
import type { CategoryFormValues, CategoryImageValue } from "../types";

export const adminCategoryKeys = { all: ["admin", "categories"] as const };

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminCategoryKeys.all });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };
}

/** Toutes les catégories (admin : actives et inactives). */
export function useAdminCategories(enabled = true) {
  return useQuery({ queryKey: adminCategoryKeys.all, queryFn: adminCategoriesService.list, enabled });
}

export function useSaveCategory(id: number | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ values, image }: { values: CategoryFormValues; image: CategoryImageValue }) =>
      id ? adminCategoriesService.update(id, values, image) : adminCategoriesService.create(values, image),
    onSuccess: invalidate,
  });
}

export function useSetCategoryActive() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, active }: { id: number; active: boolean }) => adminCategoriesService.setActive(id, active), onSuccess: invalidate });
}

export function useMoveCategory() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, dir }: { id: number; dir: "up" | "down" }) => adminCategoriesService.move(id, dir), onSuccess: invalidate });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, moveTo }: { id: number; moveTo?: number | null }) => adminCategoriesService.remove(id, moveTo), onSuccess: invalidate });
}
