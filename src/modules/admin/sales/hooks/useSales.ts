"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesService } from "../services/sales.service";
import type { SaleInput, SaleListParams } from "../types";

export const saleKeys = {
  all: ["admin", "sales"] as const,
  list: (p: SaleListParams) => ["admin", "sales", "list", p] as const,
  detail: (id: number) => ["admin", "sales", "detail", id] as const,
  orders: (q: string) => ["admin", "sales", "orders", q] as const,
};

export function useSales(params: SaleListParams, enabled = true) {
  return useQuery({ queryKey: saleKeys.list(params), queryFn: () => salesService.list(params), placeholderData: keepPreviousData, enabled });
}

export function useSale(id: number | undefined) {
  return useQuery({ queryKey: saleKeys.detail(id ?? 0), queryFn: () => salesService.detail(id as number), enabled: !!id });
}

export function useOrderSearch(q: string) {
  return useQuery({ queryKey: saleKeys.orders(q), queryFn: () => salesService.searchOrders(q), enabled: q.trim().length >= 1, staleTime: 30_000 });
}

export function useSaveSale(id: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaleInput) => (id ? salesService.update(id, input) : salesService.create(input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: saleKeys.all }),
  });
}

export function useBulkSales() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (inputs: SaleInput[]) => salesService.bulk(inputs), onSuccess: () => qc.invalidateQueries({ queryKey: saleKeys.all }) });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => salesService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: saleKeys.all }) });
}
