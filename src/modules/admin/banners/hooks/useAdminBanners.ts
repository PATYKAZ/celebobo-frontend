"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { homeKeys } from "@/modules/home/keys";
import { adminBannersService } from "../services/admin-banners.service";
import type { AdminBanner, BannerFormValues, BannerImageValue } from "../types";

export const adminBannerKeys = { list: ["admin", "banners"] as const };

export function useAdminBanners() {
  return useQuery({ queryKey: adminBannerKeys.list, queryFn: adminBannersService.list });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminBannerKeys.list });
    qc.invalidateQueries({ queryKey: homeKeys.content }); // carrousel de l'accueil
  };
}

/** `nextPosition` : position en fin de liste d'un emplacement (nouvelle bannière, ou bannière qui change d'emplacement). */
export function useSaveBanner(banner: AdminBanner | null, nextPosition: (placement: string) => number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ values, image }: { values: BannerFormValues; image: BannerImageValue }) =>
      banner
        ? adminBannersService.update(banner.id, values, image, values.placement !== banner.placement ? nextPosition(values.placement) : undefined)
        : adminBannersService.create(values, image, nextPosition(values.placement)),
    onSuccess: invalidate,
  });
}

export function usePatchBanner() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof adminBannersService.patch>[1] }) => adminBannersService.patch(id, patch),
    onSuccess: invalidate,
  });
}

/** Déplace une bannière d'un cran dans son emplacement : un seul appel avec le nouvel ordre, liste mise à jour aussitôt. */
export function useMoveBanner() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ banners, index, dir }: { banners: AdminBanner[]; index: number; dir: -1 | 1 }) => {
      const order = [...banners];
      const [moved] = order.splice(index, 1);
      order.splice(index + dir, 0, moved);
      const position = new Map(order.map((b, i) => [b.id, i]));
      qc.setQueryData<AdminBanner[]>(adminBannerKeys.list, (all) =>
        all?.map((b) => (position.has(b.id) ? { ...b, position: position.get(b.id) as number } : b)).sort((a, b) => a.position - b.position || a.id - b.id),
      );
      return adminBannersService.reorder(moved.placement, order.map((b) => b.id));
    },
    onSettled: invalidate,
  });
}

export function useDeleteBanner() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminBannersService.remove(id), onSuccess: invalidate });
}
