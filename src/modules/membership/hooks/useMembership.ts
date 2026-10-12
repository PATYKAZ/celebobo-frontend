"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membershipService } from "../services/membership.service";
import type { MyMembership, PaidPlan } from "../types";

export const membershipKeys = { mine: ["membership", "mine"] as const };

/** Abonnement du client connecté. */
export function useMyMembership(enabled = true) {
  return useQuery({ queryKey: membershipKeys.mine, queryFn: membershipService.mine, enabled });
}

/** Chaque action renvoie l'abonnement à jour : mis en cache tel quel, devis du panier à recalculer (livraison). */
function useMembershipAction<T>(fn: (input: T) => Promise<MyMembership>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.setQueryData(membershipKeys.mine, data);
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["checkout"] });
    },
  });
}

export const useStartTrial = () => useMembershipAction<void>(() => membershipService.startTrial());
export const useRequestMembership = () => useMembershipAction<{ plan: PaidPlan; paymentMethod: string }>(({ plan, paymentMethod }) => membershipService.request(plan, paymentMethod));
export const useCancelMembershipRequest = () => useMembershipAction<number>((id) => membershipService.cancel(id));
