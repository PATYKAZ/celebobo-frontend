"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesService } from "../services/sales.service";
import type { ConvertOrderInput, RefundInput, SaleInput, SaleListParams } from "../types";

export const saleKeys = {
  all: ["admin", "sales"] as const,
  list: (p: SaleListParams) => ["admin", "sales", "list", p] as const,
  detail: (id: number) => ["admin", "sales", "detail", id] as const,
  sellers: ["admin", "sales", "sellers"] as const,
  orders: (q: string) => ["admin", "sales", "orders", q] as const,
  convertible: (id: number) => ["admin", "sales", "convertible", id] as const,
};

export function useSales(params: SaleListParams, enabled = true) {
  return useQuery({ queryKey: saleKeys.list(params), queryFn: () => salesService.list(params), placeholderData: keepPreviousData, enabled });
}

export function useSale(id: number | undefined) {
  return useQuery({ queryKey: saleKeys.detail(id ?? 0), queryFn: () => salesService.detail(id as number), enabled: !!id, retry: false });
}

export function useSellers(enabled = true) {
  return useQuery({ queryKey: saleKeys.sellers, queryFn: salesService.sellers, enabled, staleTime: 5 * 60_000 });
}

/** Recherche de commandes à convertir (nom / e-mail / n°). Requête vide = commandes récentes convertibles. */
export function useOrderSearch(q: string) {
  return useQuery({ queryKey: saleKeys.orders(q.trim()), queryFn: () => salesService.searchOrders(q), staleTime: 15_000, placeholderData: keepPreviousData });
}

export function useConvertibleOrder(orderId: number | undefined) {
  return useQuery({ queryKey: saleKeys.convertible(orderId ?? 0), queryFn: () => salesService.convertible(orderId as number), enabled: !!orderId, retry: false });
}

/** Une vente change aussi stocks, commandes, tableaux de bord : on invalide tout le cache. */
function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useSaveSale(id: number | null) {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (input: SaleInput) => (id ? salesService.update(id, input) : salesService.create(input)), onSuccess: invalidate });
}

export function useCreateSales() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (inputs: SaleInput[]) => salesService.createMany(inputs), onSuccess: invalidate });
}

export function useDeleteSale() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id: number) => salesService.remove(id), onSuccess: invalidate });
}

export function useRefundSale() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: RefundInput }) => salesService.refund(id, input), onSuccess: invalidate });
}

export function useConvertOrder() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: ({ orderId, input }: { orderId: number; input: ConvertOrderInput }) => salesService.convertOrder(orderId, input), onSuccess: invalidate });
}
