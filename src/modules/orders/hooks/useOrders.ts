"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { ordersService } from "../services/orders.service";
import type { CancelOrderInput, CreateOrderInput, OrderListParams } from "../types";

export const orderKeys = {
  all: ["orders"] as const,
  list: (p: OrderListParams) => ["orders", "list", p] as const,
  detail: (number: string) => ["orders", "detail", number] as const,
};

export function useOrders(params: OrderListParams = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...orderKeys.list(params), user?.id],
    queryFn: () => ordersService.list(params),
    placeholderData: keepPreviousData,
    enabled: !!user,
  });
}

/** Détail par numéro de commande (`enabled` permet un chargement différé, ex: carte dépliée). */
export function useOrder(number: string | undefined, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: orderKeys.detail(number ?? ""),
    queryFn: () => ordersService.detail(number as string),
    enabled: !!number && !!user && enabled,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CreateOrderInput; idempotencyKey: string }) => ordersService.create(input, idempotencyKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}

export function useCancelOrder(number: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CancelOrderInput) => ordersService.cancel(number, input),
    onSuccess: (order) => {
      qc.setQueryData(orderKeys.detail(number), order);
      qc.invalidateQueries({ queryKey: ["orders", "list"] });
    },
  });
}

/** Lien de téléchargement de la facture PDF. */
export const orderInvoiceUrl = (number: string) => ordersService.invoiceUrl(number);
