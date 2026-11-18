"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { adminCouponsService } from "../services/admin-coupons.service";
import type { AdminCoupon, CouponFilter, CouponFormValues } from "../types";

export const adminCouponKeys = {
  all: ["admin", "coupons"] as const,
  list: (search: string, filter: CouponFilter) => ["admin", "coupons", search, filter] as const,
};

export function useAdminCoupons(search: string, filter: CouponFilter) {
  const q = useDebounce(search.trim(), 300);
  return useQuery({ queryKey: adminCouponKeys.list(q, filter), queryFn: () => adminCouponsService.list(q, filter), placeholderData: keepPreviousData });
}

export function useSaveCoupon(coupon: AdminCoupon | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CouponFormValues) => (coupon ? adminCouponsService.update(coupon.id, values) : adminCouponsService.create(values)),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminCouponKeys.all }),
  });
}

export function useToggleCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => adminCouponsService.setActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminCouponKeys.all }),
  });
}
