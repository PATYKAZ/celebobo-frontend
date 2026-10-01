/** accounts.models.Profile (adresses : def_* = livraison, deliv_* = facturation dans l'ancien backend). */
export interface Address {
  line1: string;
  /** quartier / commune */
  line2: string;
  country: string;
}

export interface Profile {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  avatar: string | null;
  /** Code d'invitation propre (revendeur) */
  codeRevendeur: string | null;
  /** Nombre d'utilisateurs invités par ce revendeur */
  invitedCount: number;
  /** Code du revendeur qui m'a invité */
  invitedByCode: string | null;
  deliveryAddress: Address;
  billingAddress: Address;
  sameAsDelivery: boolean;
}

export interface UpdatePersonalInput {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  revendeurCode?: string;
  avatar?: File | null;
}

export interface UpdateAddressesInput {
  deliveryAddress: Address;
  billingAddress: Address;
  sameAsDelivery: boolean;
}

export const EMPTY_ADDRESS: Address = { line1: "", line2: "", country: "RD Congo" };
