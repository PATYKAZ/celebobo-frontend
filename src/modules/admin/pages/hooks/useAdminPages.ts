"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminPagesService, type AdminPage, type PageFormValues } from "../services/admin-pages.service";

export const adminPageKeys = { all: ["admin", "pages"] as const };

export function useAdminPages() {
  return useQuery({ queryKey: adminPageKeys.all, queryFn: adminPagesService.list });
}

/** Les pages publiques sont relues après chaque changement (contenu, liste « Informations utiles »). */
function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminPageKeys.all });
    qc.invalidateQueries({ queryKey: ["pages"] });
  };
}

export function useSavePage(page: AdminPage | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (values: PageFormValues) => (page ? adminPagesService.update(page.id, values) : adminPagesService.create(values)),
    onSuccess: invalidate,
  });
}

export function usePublishPage() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) => adminPagesService.setPublished(id, isPublished), onSuccess: invalidate });
}

export function useDeletePage() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminPagesService.remove(id), onSuccess: invalidate });
}
