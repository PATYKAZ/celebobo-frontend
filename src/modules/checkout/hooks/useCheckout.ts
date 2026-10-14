"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { checkoutService, type QuoteLineInput } from "../services/checkout.service";

export const checkoutKeys = {
  quote: (lines: QuoteLineInput[], city: string, coupon: string | null, cashback: boolean) => ["checkout", "quote", lines, city, coupon, cashback] as const,
  zones: ["checkout", "zones"] as const,
  payments: ["checkout", "payment-methods"] as const,
};

/** Devis de la commande, recalculé quand la ville (zone de livraison), les lignes, le code promo ou l'usage de la cagnotte changent. */
export function useCheckoutQuote(lines: QuoteLineInput[], city: string, couponCode: string | null, useCashback = false) {
  const debouncedCity = useDebounce(city.trim(), 400);
  return useQuery({
    queryKey: checkoutKeys.quote(lines, debouncedCity, couponCode, useCashback),
    queryFn: () => checkoutService.quote(lines, debouncedCity, couponCode, useCashback),
    enabled: lines.length > 0,
    placeholderData: keepPreviousData,
  });
}

export function useShippingZones() {
  return useQuery({ queryKey: checkoutKeys.zones, queryFn: checkoutService.shippingZones, staleTime: 10 * 60_000 });
}

export function usePaymentMethods() {
  return useQuery({ queryKey: checkoutKeys.payments, queryFn: checkoutService.paymentMethods, staleTime: 10 * 60_000 });
}
