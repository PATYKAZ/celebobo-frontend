"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersService } from "../services/orders.service";
import type { CreateOrderInput, OrderListParams } from "../types";

export const orderKeys = {
  all: ["orders"] as const,
  list: (p: OrderListParams) => ["orders", "list", p] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
};

export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: number | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? 0),
    queryFn: () => ordersService.detail(id as number),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
