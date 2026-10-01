import type { PaymentMethod } from "@/modules/orders/types";

export type DashboardPeriod = "7d" | "30d" | "12m";

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

export interface DashboardKpis {
  monthRevenue: number;
  monthRevenueDelta: number;
  profit: number;
  profitDelta: number;
  dayRevenue: number;
  dayRevenueDelta: number;
  monthSales: number;
  monthSalesDelta: number;
  /** Part des smartphones dans le revenu du mois (%) */
  smartphonesShare: number;
  smartphonesDelta: number;
  pendingOrders: number;
}

export interface DashboardSale {
  id: number;
  productName: string;
  productImage: string | null;
  buyer: string;
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
}

export interface DashboardData {
  kpis: DashboardKpis;
  series: { labels: string[]; revenue: number[]; profit: number[] };
  methods: { method: PaymentMethod; total: number }[];
  topProducts: DashboardTopProduct[];
  recentSales: DashboardSale[];
  pendingOrders: DashboardPendingOrder[];
}
