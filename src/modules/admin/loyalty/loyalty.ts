"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { siteKeys } from "@/modules/site/keys";
import { toProgrammes, type ProgrammesDto } from "@/modules/site/services/site.mapper";
import type { Programmes } from "@/modules/site/types";

/** Champs du formulaire (chaînes pour les nombres). */
export interface LoyaltyFormValues {
  membershipEnabled: boolean;
  membershipMonthlyPrice: string;
  membershipYearlyPrice: string;
  membershipTrialDays: string;
  membershipReminderDays: string;
  cashbackEnabled: boolean;
  cashbackPercent: string;
  cashbackMaxShare: string;
  cashbackMinBalance: string;
  cashbackValidityMonths: string;
  cashbackMembersOnly: boolean;
  appStoreUrl: string;
  playStoreUrl: string;
}

export const toLoyaltyForm = ({ membership: m, cashback: c, appLinks: a }: Programmes): LoyaltyFormValues => ({
  membershipEnabled: m.enabled,
  membershipMonthlyPrice: m.monthlyPrice.toFixed(2),
  membershipYearlyPrice: m.yearlyPrice.toFixed(2),
  membershipTrialDays: String(m.trialDays),
  membershipReminderDays: String(m.reminderDays),
  cashbackEnabled: c.enabled,
  cashbackPercent: String(c.percent),
  cashbackMaxShare: String(c.maxShare),
  cashbackMinBalance: c.minBalance.toFixed(2),
  cashbackValidityMonths: String(c.validityMonths),
  cashbackMembersOnly: c.membersOnly,
  appStoreUrl: a.appStore,
  playStoreUrl: a.playStore,
});

const dec = (s: string) => Number(s.replace(",", ".")).toFixed(2);

/** Corps du PATCH `/bo/loyalty/settings/` (camelCase → snake_case par le client API). */
const toPayload = (v: LoyaltyFormValues) => ({
  membershipEnabled: v.membershipEnabled,
  membershipMonthlyPrice: dec(v.membershipMonthlyPrice),
  membershipYearlyPrice: dec(v.membershipYearlyPrice),
  membershipTrialDays: Number(v.membershipTrialDays),
  membershipReminderDays: Number(v.membershipReminderDays),
  cashbackEnabled: v.cashbackEnabled,
  cashbackPercent: dec(v.cashbackPercent),
  cashbackMaxShare: Number(v.cashbackMaxShare),
  cashbackMinBalance: dec(v.cashbackMinBalance),
  cashbackValidityMonths: Number(v.cashbackValidityMonths),
  cashbackMembersOnly: v.cashbackMembersOnly,
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
