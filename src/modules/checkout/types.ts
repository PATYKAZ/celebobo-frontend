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

/** Zone de livraison (frais et délai selon la ville). */
export interface ShippingZone {
  id: number;
  name: string;
  cities: string[];
  fee: number;
  freeThreshold: number | null;
  deliveryEstimate: string;
  isDefault: boolean;
}
