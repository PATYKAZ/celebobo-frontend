"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { siteKeys } from "@/modules/site/keys";
import { toProgrammes, type ProgrammesDto } from "@/modules/site/services/site.mapper";
import type { Programmes } from "@/modules/site/types";

/** Champs du formulaire (chaînes pour les nombres). */
export interface LoyaltyFormValues {
  pointsEnabled: boolean;
  pointsPercent: string;
  pointsValidityMonths: string;
  appStoreUrl: string;
  playStoreUrl: string;
}

export const toLoyaltyForm = ({ points: p, appLinks: a }: Programmes): LoyaltyFormValues => ({
  pointsEnabled: p.enabled,
  pointsPercent: String(p.percent),
  pointsValidityMonths: String(p.validityMonths),
  appStoreUrl: a.appStore,
  playStoreUrl: a.playStore,
});

const dec = (s: string) => Number(s.replace(",", ".")).toFixed(2);

/** Corps du PATCH `/bo/loyalty/settings/` (camelCase → snake_case par le client API). */
const toPayload = (v: LoyaltyFormValues) => ({
  pointsEnabled: v.pointsEnabled,
  pointsPercent: dec(v.pointsPercent),
  pointsValidityMonths: Number(v.pointsValidityMonths),
  appStoreUrl: v.appStoreUrl.trim(),
  playStoreUrl: v.playStoreUrl.trim(),
});

const loyaltyKey = ["admin", "loyalty"] as const;

export function useLoyaltySettings() {
  return useQuery({ queryKey: loyaltyKey, queryFn: async () => toProgrammes(await api.get<ProgrammesDto>(ENDPOINTS.admin.loyalty)) });
}

export function useSaveLoyalty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: LoyaltyFormValues) => toProgrammes(await api.patch<ProgrammesDto>(ENDPOINTS.admin.loyalty, toPayload(v))),
    onSuccess: (data) => {
      qc.setQueryData(loyaltyKey, data);
      qc.invalidateQueries({ queryKey: siteKeys.settings }); // blocs de l'accueil
    },
  });
}
