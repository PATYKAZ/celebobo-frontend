export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

/** Sujets acceptés par `POST /contact/`. */
export const CONTACT_SUBJECTS = [
  { value: "order", label: "Suivi de commande" },
  { value: "product", label: "Question sur un produit" },
  { value: "reseller", label: "Devenir revendeur" },
  { value: "partnership", label: "Partenariat" },
  { value: "other", label: "Autre demande" },
];

/** Accusé de réception local (l'API répond 202 sans corps). */
export interface ContactReceipt {
  sentAt: string;
}
