import type { ResellerAvailability as Availability } from "@/modules/auth/types";

export interface CommissionRow {
  resellerId: number;
  name: string;
  avatar: string | null;
  availability: Availability;
  active: boolean;
  /** nombre de ventes valides (cumul) */
  salesCount: number;
  /** Commission gagnée (cumul depuis le début) */
  earned: number;
  /** Commission gagnée sur le mois en cours */
  earnedMonth: number;
  /** En attente : pas encore 7 jours après la livraison (ou la vente) */
  pending: number;
  /** Validé (payable), net des annulations */
  validated: number;
  /** Frais de livraison reversés (commandes livrées par le revendeur) */
  deliveryFees: number;
  paid: number;
  /** validé + frais de livraison − payé */
  due: number;
  /** Prochaine date de paiement (1er ou 16 du mois), ISO yyyy-mm-dd */
  nextPayoutDate: string;
  /** Seuil de paiement (5 $) : en dessous, reporté au paiement suivant */
  threshold: number;
  lastPaymentAt: string | null;
}

/** Règles communes à tous les revendeurs (décidées le 16 nov. 2026, calculées par l'API). */
export const COMMISSION_RULES_SUMMARY =
  "10 % du montant payé, plafonnés à 50 % de la marge (produits Celebobo) ou à 20 % du gain Celebobo (produits partenaires) ; rien sur une commande payée en partie avec des points ou un coupon";

export interface CommissionPayment {
  id: number;
  resellerId: number;
  resellerName: string;
  amount: number;
  paidAt: string;
  note: string | null;
  paidByName: string;
  statementId: number | null;
  payoutDate: string | null;
}

export interface CommissionTotals {
  earned: number;
  earnedMonth: number;
  pending: number;
  validated: number;
  deliveryFees: number;
  paid: number;
  due: number;
}

export type StatementStatus = "prepared" | "paid" | "cancelled";
export type StatementLineKind = "commission" | "reversal" | "delivery_fee" | "delivery_fee_reversal";

/** Relevé de paiement : préparé le 1er ou le 16 pour un solde payable ≥ 5 $, puis payé par un admin. */
export interface PayoutStatement {
  id: number;
  resellerId: number;
  resellerName: string;
  /** ISO yyyy-mm-dd */
  payoutDate: string;
  status: StatementStatus;
  commissions: number;
  deliveryFees: number;
  total: number;
  preparedAt: string;
  paidAt: string | null;
}

export interface StatementLine {
  kind: StatementLineKind;
  title: string;
  saleId: number | null;
  orderNumber: string | null;
  baseAmount: number | null;
  amount: number;
  at: string;
}

export interface PayoutStatementDetail extends PayoutStatement {
  lines: StatementLine[];
}

export interface CommissionsOverview {
  /** all = responsable/admin (tous les revendeurs) ; own = revendeur (uniquement lui) */
  scope: "all" | "own";
  /** « Cumul au 02 oct. 2026 » */
  asOfLabel: string;
  /** « octobre 2026 » */
  monthLabel: string;
  rows: CommissionRow[];
  totals: CommissionTotals;
  /** Revendeur : commissions gagnées par mois (6 derniers mois) */
  monthly?: { labels: string[]; values: number[] };
  /** Revendeur : ses paiements */
  payments?: CommissionPayment[];
  /** Revendeur : ses relevés de paiement */
  statements?: PayoutStatement[];
}

export interface PayStatementInput {
  statementId: number;
  note?: string;
}
