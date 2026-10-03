import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { money } from "@/modules/products/services/products.mapper";
import { toQuote, type QuoteDto } from "@/modules/cart/services/cart.mapper";
import type { CartQuote } from "@/modules/cart/types";
import { PAYMENT_FROM_API, type ApiPaymentMethod } from "@/modules/orders/services/orders.mapper";
import type { PaymentMethod } from "@/modules/orders/types";
import type { ShippingZone } from "../types";

interface ZoneDto {
  id: number;
  name: string;
  cities: string[];
  fee: string;
  freeThreshold: string | null;
  deliveryEstimate: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface QuoteLineInput {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

export const checkoutService = {
  /** Devis : sous-total, remise du code promo et frais de la zone de livraison de `city`. */
  async quote(lines: QuoteLineInput[], city?: string, couponCode?: string | null): Promise<CartQuote> {
    const dto = await api.post<QuoteDto>(ENDPOINTS.checkout.quote, {
      lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId ?? null, quantity: l.quantity })),
      city: city?.trim() || undefined,
      couponCode: couponCode || undefined,
    });
    return toQuote(dto);
  },

  async shippingZones(): Promise<ShippingZone[]> {
    const zones = await api.get<ZoneDto[]>(ENDPOINTS.checkout.shippingZones);
    return zones
      .filter((z) => z.isActive)
      .map((z) => ({ id: z.id, name: z.name, cities: z.cities, fee: money(z.fee), freeThreshold: z.freeThreshold == null ? null : money(z.freeThreshold), deliveryEstimate: z.deliveryEstimate, isDefault: z.isDefault }));
  },

  /** Modes de paiement activés (réglages publics de la boutique). */
  async paymentMethods(): Promise<PaymentMethod[]> {
    const settings = await api.get<{ paymentMethods: string[] }>(ENDPOINTS.checkout.settings);
    return settings.paymentMethods.map((m) => PAYMENT_FROM_API[m as ApiPaymentMethod]).filter(Boolean);
  },
};
