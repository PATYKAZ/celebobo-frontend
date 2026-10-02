import type { Availability } from "@/shared/mock-db/types";

export interface CommissionRow {
  resellerId: number;
  name: string;
  avatar: string | null;
  availability: Availability;
  active: boolean;
  /** 0.07 = 7 % */
  rate: number;
  /** nombre de ventes valides (cumul) */
  salesCount: number;
  /** Commission gagnée (cumul depuis le début) */
  earned: number;
  /** Commission gagnée sur le mois en cours */
  earnedMonth: number;
  paid: number;
  /** earned − paid */
  due: number;
  lastPaymentAt: string | null;
}

export interface CommissionPayment {
  id: number;
  resellerId: number;
  resellerName: string;
  amount: number;
  paidAt: string;
  note: string | null;
  paidByName: string;
}

export interface CommissionTotals {
  earned: number;
  earnedMonth: number;
  paid: number;
  due: number;
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
}

export interface PayCommissionInput {
  resellerId: number;
  amount: number;
  note?: string;
}
