export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

export const CONTACT_SUBJECTS = [
  { value: "commande", label: "Suivi de commande" },
  { value: "produit", label: "Question sur un produit" },
  { value: "revendeur", label: "Devenir revendeur" },
  { value: "retour", label: "Retour / garantie" },
  { value: "autre", label: "Autre demande" },
];

/** Accusé de réception d'un message (numéro de référence à citer au support). */
export interface ContactReceipt {
  reference: string;
  sentAt: string;
}
