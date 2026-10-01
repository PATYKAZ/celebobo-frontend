import type { PaymentMethod } from "@/modules/orders/types";

export interface CheckoutForm {
  address: string;
  quarter: string;
  country: string;
  phone: string;
  paymentMethod: PaymentMethod;
  note: string;
}

export const CHECKOUT_STEPS = ["Livraison", "Paiement", "Confirmation"] as const;
