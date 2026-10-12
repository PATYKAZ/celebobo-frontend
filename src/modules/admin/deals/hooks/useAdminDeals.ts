"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { homeKeys } from "@/modules/home/keys";
import { productKeys } from "@/modules/products/keys";
import { adminDealsService } from "../services/admin-deals.service";
import type { AdminDeal, DealFormValues, DealStatus } from "../types";

export const adminDealKeys = {
  all: ["admin", "deals"] as const,
  list: (status?: DealStatus) => ["admin", "deals", status ?? "all"] as const,
};

export function useAdminDeals(status?: DealStatus) {
  return useQuery({ queryKey: adminDealKeys.list(status), queryFn: () => adminDealsService.list(status) });
}

/** Une offre change le prix du produit partout : liste admin, accueil et fiches produit à recharger. */
function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminDealKeys.all });
    qc.invalidateQueries({ queryKey: homeKeys.content });
    qc.invalidateQueries({ queryKey: productKeys.all });
  };
}

export function useSaveDeal(deal: AdminDeal | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (values: DealFormValues) => (deal ? adminDealsService.update(deal.id, values) : adminDealsService.create(values)),
    onSuccess: invalidate,
  });
}

export function usePatchDeal() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => adminDealsService.patch(id, { isActive }), onSuccess: invalidate });
}

export function useDeleteDeal() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminDealsService.remove(id), onSuccess: invalidate });
}
