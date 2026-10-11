"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { siteKeys } from "@/modules/site/keys";
import { adminSettingsService } from "../services/admin-settings.service";
import type { AdminShippingZone, SettingsFormValues, ZoneFormValues } from "../types";

export const adminSettingsKeys = {
  settings: ["admin", "settings"] as const,
  zones: ["admin", "shipping-zones"] as const,
};

export function useAdminSettings(enabled = true) {
  return useQuery({ queryKey: adminSettingsKeys.settings, queryFn: adminSettingsService.get, enabled });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SettingsFormValues) => adminSettingsService.update(values),
    onSuccess: (data) => {
      qc.setQueryData(adminSettingsKeys.settings, data);
      // boutique : coordonnées, horaires et taux affichés partout
      qc.invalidateQueries({ queryKey: siteKeys.settings });
    },
  });
}

export function useShippingZonesAdmin() {
  return useQuery({ queryKey: adminSettingsKeys.zones, queryFn: adminSettingsService.zones });
}

function useInvalidateZones() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminSettingsKeys.zones });
    qc.invalidateQueries({ queryKey: ["checkout"] }); // zones et devis de la commande
    qc.invalidateQueries({ queryKey: siteKeys.settings }); // frais affichés (règles de livraison)
  };
}

export function useSaveZone(zone: AdminShippingZone | null, nextPosition: number) {
  const invalidate = useInvalidateZones();
  return useMutation({
    mutationFn: (values: ZoneFormValues) => (zone ? adminSettingsService.updateZone(zone.id, values) : adminSettingsService.createZone(values, nextPosition)),
    onSuccess: invalidate,
  });
}

export function usePatchZone() {
  const invalidate = useInvalidateZones();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof adminSettingsService.patchZone>[1] }) => adminSettingsService.patchZone(id, patch),
    onSuccess: invalidate,
  });
}

/** Déplace une zone d'un cran ; les positions sont renumérotées 0, 1, 2… (seules celles qui changent sont envoyées). */
export function useMoveZone() {
  const invalidate = useInvalidateZones();
  return useMutation({
    mutationFn: async ({ zones, index, dir }: { zones: AdminShippingZone[]; index: number; dir: -1 | 1 }) => {
      const order = [...zones];
      const [moved] = order.splice(index, 1);
      order.splice(index + dir, 0, moved);
      await Promise.all(order.map((z, position) => (z.position === position ? null : adminSettingsService.patchZone(z.id, { position }))));
    },
    onSuccess: invalidate,
  });
}

export function useDeleteZone() {
  const invalidate = useInvalidateZones();
  return useMutation({ mutationFn: (id: number) => adminSettingsService.deleteZone(id), onSuccess: invalidate });
}
