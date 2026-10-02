import type { PaymentMethod } from "@/modules/orders/types";
import type { PeriodKey } from "./lib/stats";

export type DashboardPeriod = PeriodKey;

export const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "7d", label: "7 j" },
  { value: "30d", label: "30 j" },
  { value: "12m", label: "12 mois" },
];

/** Couleurs de marque des moyens de paiement (graphiques). */
export const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  OrangeMoney: "#FF7900",
  AirtelMoney: "#E40000",
  "M-Pesa": "#1ABA1A",
  Cash: "#222222",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  OrangeMoney: "Orange Money",
  AirtelMoney: "Airtel Money",
  "M-Pesa": "M-Pesa",
  Cash: "Cash",
};

/** Variation en % vs période précédente (null = pas de référence). */
export type Delta = number | null;

export interface DashboardKpis {
  revenue: number;
  revenueDelta: Delta;
  profit: number;
  profitDelta: Delta;
  /** 24 dernières heures */
  dayRevenue: number;
  dayRevenueDelta: Delta;
  sales: number;
  salesDelta: Delta;
  /** Part des smartphones dans le revenu de la période (%) */
  smartphonesShare: number;
  smartphonesDelta: Delta;
  pendingOrders: number;
  unassignedOrders: number;
}

export interface DashboardSale {
  id: number;
  productName: string;
  productImage: string | null;
  buyer: string;
  seller: string;
  method: PaymentMethod;
  priceFinal: number;
  date: string;
}

export interface DashboardTopProduct {
  id: number;
  name: string;
  image: string | null;
  units: number;
  revenue: number;
}

export interface DashboardPendingOrder {
  id: number;
  buyer: string;
  total: number;
  createdAt: string;
  conversationId: number | null;
  itemsCount: number;
  assignedTo: string | null;
}

export interface DashboardData {
  periodKey: DashboardPeriod;
  /** « 30 derniers jours (02 sept. 2026 → 02 oct. 2026) » */
  periodLabel: string;
  previousPeriodLabel: string;
  kpis: DashboardKpis;
  series: { labels: string[]; revenue: number[]; profit: number[] };
  methods: { method: PaymentMethod; total: number }[];
  topProducts: DashboardTopProduct[];
  recentSales: DashboardSale[];
  pendingOrders: DashboardPendingOrder[];
  /** Meilleur revendeur sur la période = 1re ligne du tableau Revendeurs (même période). */
  topReseller: { id: number; name: string; revenue: number } | null;
}
