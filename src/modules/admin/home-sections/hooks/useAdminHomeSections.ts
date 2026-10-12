"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { homeKeys } from "@/modules/home/keys";
import { adminHomeSectionsService } from "../services/admin-home-sections.service";
import type { HomeSection, SectionFormValues } from "../types";

export const adminHomeSectionKeys = { list: ["admin", "home-sections"] as const };

export function useAdminHomeSections(enabled = true) {
  return useQuery({ queryKey: adminHomeSectionKeys.list, queryFn: adminHomeSectionsService.list, enabled });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminHomeSectionKeys.list });
    qc.invalidateQueries({ queryKey: homeKeys.content });
  };
}

export function useSaveSection(section: HomeSection | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: SectionFormValues) => (section ? adminHomeSectionsService.update(section.id, v) : adminHomeSectionsService.create(v)),
    onSuccess: invalidate,
  });
}

export function useSetSectionActive() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => adminHomeSectionsService.setActive(id, isActive), onSuccess: invalidate });
}

/** Déplace une section d'un cran : un appel avec l'ordre complet, liste mise à jour aussitôt. */
export function useMoveSection() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ sections, index, dir }: { sections: HomeSection[]; index: number; dir: -1 | 1 }) => {
      const order = [...sections];
      const [moved] = order.splice(index, 1);
      order.splice(index + dir, 0, moved);
      qc.setQueryData<HomeSection[]>(adminHomeSectionKeys.list, order.map((s, position) => ({ ...s, position })));
      return adminHomeSectionsService.reorder(order.map((s) => s.id));
    },
    onSettled: invalidate,
  });
}

export function useDeleteSection() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminHomeSectionsService.remove(id), onSuccess: invalidate });
}
