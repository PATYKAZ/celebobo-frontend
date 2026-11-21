"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { checkoutService, type QuoteLineInput } from "../services/checkout.service";

export const checkoutKeys = {
  quote: (lines: QuoteLineInput[], city: string, coupon: string | null, points: number, pickup: boolean) => ["checkout", "quote", lines, city, coupon, points, pickup] as const,
  zones: ["checkout", "zones"] as const,
  payments: ["checkout", "payment-methods"] as const,
};

/** Devis de la commande, recalculé quand la ville (zone de livraison), le retrait, les lignes, le code promo ou le nombre de points utilisés changent (ville et points après une courte pause de saisie). */
export function useCheckoutQuote(lines: QuoteLineInput[], city: string, couponCode: string | null, points = 0, pickup = false) {
  const debouncedCity = useDebounce(city.trim(), 400);
  const debouncedPoints = useDebounce(points, 400);
  const query = useQuery({
    queryKey: checkoutKeys.quote(lines, debouncedCity, couponCode, debouncedPoints, pickup),
    queryFn: () => checkoutService.quote(lines, debouncedCity, couponCode, debouncedPoints, pickup),
    enabled: lines.length > 0,
    placeholderData: keepPreviousData,
  });
  // saisie de points pas encore envoyée au devis : le total affiché ne reflète pas encore le choix du client
  return { ...query, pointsSettling: debouncedPoints !== points };
}

export function useShippingZones() {
  return useQuery({ queryKey: checkoutKeys.zones, queryFn: checkoutService.shippingZones, staleTime: 10 * 60_000 });
}

export function usePaymentMethods() {
  return useQuery({ queryKey: checkoutKeys.payments, queryFn: checkoutService.paymentMethods, staleTime: 10 * 60_000 });
}
