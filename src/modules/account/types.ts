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

/** Carnet d'adresses (v2) — plusieurs adresses, une par défaut. */
export interface SavedAddress {
  id: number;
  /** Domicile, Bureau… */
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  /** quartier / commune */
  quarter: string;
  city: string;
  country: string;
  isDefault: boolean;
}

export type SavedAddressInput = Omit<SavedAddress, "id" | "isDefault"> & { isDefault?: boolean };

export const ADDRESS_LABELS = ["Domicile", "Bureau", "Famille", "Autre"] as const;

/** Préférences de notification (v2). */
export type NotificationEvent = "orderAssigned" | "statusChanged" | "newMessage" | "promotions";
export type NotificationChannel = "email" | "push";
export type NotificationPreferences = Record<NotificationEvent, Record<NotificationChannel, boolean>>;

export const NOTIFICATION_EVENTS: { key: NotificationEvent; label: string; description: string }[] = [
  { key: "orderAssigned", label: "Commande prise en charge", description: "Un revendeur est assigné à votre commande." },
  { key: "statusChanged", label: "Changement de statut", description: "Confirmée, payée, en livraison, livrée…" },
  { key: "newMessage", label: "Nouveau message", description: "Un revendeur vous répond dans la discussion." },
  { key: "promotions", label: "Offres & nouveautés", description: "Promotions, nouveaux produits, codes de réduction." },
];

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  orderAssigned: { email: true, push: true },
  statusChanged: { email: true, push: true },
  newMessage: { email: false, push: true },
  promotions: { email: false, push: false },
};
