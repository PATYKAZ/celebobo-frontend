/** @deprecated L'API n'a pas d'adresse sur le profil : utiliser le carnet d'adresses (`useAddresses`). */
export interface Address {
  line1: string;
  /** quartier / commune */
  line2: string;
  country: string;
}

/** Profil de `GET /me/`. */
export interface Profile {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  avatar: string | null;
  emailVerified: boolean;
  dateJoined: string;
  /** Code d'invitation propre (revendeur) */
  codeRevendeur: string | null;
  /** Nombre d'utilisateurs invités par ce revendeur */
  invitedCount: number;
  /** Code du revendeur qui m'a invité (définitif une fois renseigné) */
  invitedByCode: string | null;
  /** @deprecated toujours vide — l'adresse de livraison vient du carnet d'adresses. */
  deliveryAddress: Address;
}

export interface UpdatePersonalInput {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  revendeurCode?: string;
  avatar?: File | null;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

/** @deprecated cf. `Address`. */
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
export type AddressLabel = (typeof ADDRESS_LABELS)[number];

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

/** Appareil abonné aux notifications push (`GET /me/devices/`). */
export interface PushDevice {
  id: number;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string | null;
}
