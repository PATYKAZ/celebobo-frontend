import type { PaymentMethod } from "@/modules/orders/types";

export interface CheckoutForm {
  /** Adresse du carnet choisie (null = nouvelle adresse saisie ci-dessous) */
  addressId: number | null;
  /** Enregistrer la nouvelle adresse dans le carnet */
  saveToBook: boolean;
  addressLabel: string;
  recipient: string;
  address: string;
  quarter: string;
  city: string;
  country: string;
  phone: string;
  paymentMethod: PaymentMethod;
  note: string;
}

export const CHECKOUT_STEPS = ["Livraison", "Paiement", "Confirmation"] as const;
