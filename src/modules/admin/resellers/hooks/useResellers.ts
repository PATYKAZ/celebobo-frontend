"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resellersService } from "../services/resellers.service";
import type { CreateResellerInput, ResellerListParams } from "../types";

export const resellerKeys = {
  list: (p: ResellerListParams) => ["admin", "resellers", "list", p] as const,
  detail: (id: number | null, period: string) => ["admin", "resellers", "detail", id, period] as const,
};

export function useResellers(params: ResellerListParams) {
  return useQuery({
    queryKey: resellerKeys.list(params),
    queryFn: () => resellersService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useReseller(id: number | null, period: NonNullable<ResellerListParams["period"]> = "30d") {
  return useQuery({
    queryKey: resellerKeys.detail(id, period),
    queryFn: () => resellersService.detail(id as number, period),
    enabled: id != null,
  });
}

/** Après toute mutation : liste, détail, commissions, dashboard, analytique et options d'assignation. */
function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useCreateReseller() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (input: CreateResellerInput) => resellersService.create(input), onSuccess: inv });
}

export function useSetResellerActive() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: ({ id, active }: { id: number; active: boolean }) => resellersService.setActive(id, active), onSuccess: inv });
}

export function useUpdateResellerRate() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: ({ id, rate }: { id: number; rate: number }) => resellersService.updateRate(id, rate), onSuccess: inv });
}
