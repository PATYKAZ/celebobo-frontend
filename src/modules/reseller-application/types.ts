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

/** Paliers de commission indicatifs affichés sur la page (taux réel fixé par le responsable à l'activation). */
export const COMMISSION_TIERS = [
  { from: 0, to: 1000, rate: 0.05, label: "Démarrage" },
  { from: 1000, to: 3000, rate: 0.07, label: "Confirmé" },
  { from: 3000, to: Infinity, rate: 0.1, label: "Expert" },
] as const;

/** Commission estimée pour un chiffre d'affaires mensuel (taux du palier atteint appliqué à l'ensemble). */
export function estimateCommission(monthlySales: number) {
  const tier = [...COMMISSION_TIERS].reverse().find((t) => monthlySales >= t.from) ?? COMMISSION_TIERS[0];
  return { tier, amount: monthlySales * tier.rate };
}
