export interface ResellerApplicationInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  /** Pourquoi souhaitez-vous devenir revendeur ? */
  motivation: string;
}

/** Accusé de `POST /reseller-applications/`. */
export interface ResellerApplicationReceipt {
  reference: string;
  status: string;
  submittedAt: string;
}

/** Part maximale du montant payé (règles du 16 nov. 2026, identiques pour tous les revendeurs). */
export const MAX_COMMISSION_SHARE = 0.1;

/** Règles affichées sur la page (le calcul exact est fait par l'API sur chaque vente). */
export const COMMISSION_RULES = [
  { title: "Produit Celebobo", text: "10 % du montant payé, au plus la moitié de la marge" },
  { title: "Produit partenaire", text: "10 % du montant payé, au plus 20 % du gain Celebobo" },
  { title: "Points ou coupon", text: "Pas de commission sur la commande" },
] as const;

/** Commission maximale pour un montant mensuel de ventes payées en argent réel. */
export const maxCommission = (monthlySales: number) => monthlySales * MAX_COMMISSION_SHARE;
