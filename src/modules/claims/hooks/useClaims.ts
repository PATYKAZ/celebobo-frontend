"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { claimsService } from "../services/claims.service";
import type { Claim, ClaimStatus, Diagnosis, NewClaim, ReturnMethod } from "../types";

export const claimKeys = {
  all: ["claims"] as const,
  claimable: (orderId: number) => ["claims", "claimable", orderId] as const,
  mine: (page: number) => ["claims", "mine", page] as const,
  mineDetail: (id: number) => ["claims", "mine", "detail", id] as const,
  list: (status: string, page: number) => ["claims", "bo", status, page] as const,
  detail: (id: number) => ["claims", "bo", "detail", id] as const,
};

export const useClaimable = (orderId: number | undefined) =>
  useQuery({ queryKey: claimKeys.claimable(orderId ?? 0), queryFn: () => claimsService.claimable(orderId as number), enabled: !!orderId, retry: false });

export const useMyClaims = (page: number) => useQuery({ queryKey: claimKeys.mine(page), queryFn: () => claimsService.mine(page), placeholderData: keepPreviousData });

export const useMyClaim = (id: number) => useQuery({ queryKey: claimKeys.mineDetail(id), queryFn: () => claimsService.mineDetail(id), retry: false });

export function useSubmitClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, key }: { input: NewClaim; key: string }) => claimsService.submit(input, key),
    onSuccess: () => qc.invalidateQueries({ queryKey: claimKeys.all }),
  });
}

export const useClaims = (status: ClaimStatus | "all", page: number) =>
  useQuery({ queryKey: claimKeys.list(status, page), queryFn: () => claimsService.list(status, page), placeholderData: keepPreviousData });

export const useClaim = (id: number) => useQuery({ queryKey: claimKeys.detail(id), queryFn: () => claimsService.detail(id), retry: false });

/** Les étapes de l'équipe : chaque réponse remplace la réclamation affichée. */
export function useClaimStep(id: number) {
  const qc = useQueryClient();
  const done = (claim: Claim) => {
    qc.setQueryData(claimKeys.detail(id), claim);
    qc.invalidateQueries({ queryKey: claimKeys.all });
  };
  return {
    answer: useMutation({ mutationFn: ({ method, note }: { method: ReturnMethod; note: string }) => claimsService.answer(id, method, note), onSuccess: done }),
    receive: useMutation({ mutationFn: ({ sealed, note }: { sealed: boolean | null; note: string }) => claimsService.receive(id, sealed, note), onSuccess: done }),
    diagnose: useMutation({ mutationFn: (d: Diagnosis) => claimsService.diagnose(id, d), onSuccess: done }),
    repaired: useMutation({ mutationFn: (note: string) => claimsService.repaired(id, note), onSuccess: done }),
  };
}
