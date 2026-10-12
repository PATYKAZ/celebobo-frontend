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

export function useSaveBanner(banner: AdminBanner | null, nextPosition: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ values, image }: { values: BannerFormValues; image: BannerImageValue }) =>
      banner ? adminBannersService.update(banner.id, values, image) : adminBannersService.create(values, image, nextPosition),
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

/** Déplace une bannière d'un cran : positions renumérotées 0, 1, 2… (seules celles qui changent sont envoyées). */
export function useMoveBanner() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ banners, index, dir }: { banners: AdminBanner[]; index: number; dir: -1 | 1 }) => {
      const order = [...banners];
      const [moved] = order.splice(index, 1);
      order.splice(index + dir, 0, moved);
      await Promise.all(order.map((b, position) => (b.position === position ? null : adminBannersService.patch(b.id, { position }))));
    },
    onSuccess: invalidate,
  });
}

export function useDeleteBanner() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminBannersService.remove(id), onSuccess: invalidate });
}
