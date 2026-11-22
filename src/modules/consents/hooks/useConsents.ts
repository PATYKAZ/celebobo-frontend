"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { consentsService } from "../services/consents.service";
import type { ConsentKind, ConsentOverview } from "../types";

export const consentKeys = { all: ["account", "consents"] as const };

export function useConsents() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: [...consentKeys.all, userId], queryFn: consentsService.overview, enabled: !!userId });
}

/** Met à jour la liste et l'état de complétion du compte (garde de complétion, en-tête) puis resynchronise `/me/`. */
function useConsentMutation<T>(fn: (input: T) => Promise<ConsentOverview>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (overview) => {
      const userId = useAuthStore.getState().user?.id;
      qc.setQueryData([...consentKeys.all, userId], overview);
      useAuthStore.getState().patchUser({ missingConsents: overview.missing });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export const useGiveConsents = () => useConsentMutation<ConsentKind[]>(consentsService.give);
export const useWithdrawConsent = () => useConsentMutation<ConsentKind>(consentsService.withdraw);
