import type { PaymentMethod } from "@/modules/orders/types";

export type AnalyticsRange = "30d" | "90d" | "12m" | "ytd";

export const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "12m", label: "12 mois" },
  { value: "ytd", label: "Année en cours" },
];

export interface AnalyticsFilters {
  range: AnalyticsRange;
  /** id de catégorie ou "all" */
  category: number | "all";
  method: PaymentMethod | "all";
}

export const DEFAULT_FILTERS: AnalyticsFilters = { range: "90d", category: "all", method: "all" };

export interface AnalyticsSummary {
  revenue: number;
  revenueDelta: number | null;
  profit: number;
  profitDelta: number | null;
  sales: number;
  salesDelta: number | null;
  avgBasket: number;
  avgBasketDelta: number | null;
}

/** Produit en stock sans vente récente. */
export interface SlowMover {
  id: number;
  name: string;
  image: string | null;
  stock: number;
  /** null = jamais vendu */
  daysSinceLastSale: number | null;
}

export interface AnalyticsData {
  /** « 90 derniers jours (… → …) » */
  periodLabel: string;
  previousPeriodLabel: string;
  summary: AnalyticsSummary;
  /** Ventes par période : barres = revenu, ligne = bénéfice */
  monthly: { labels: string[]; revenue: number[]; profit: number[] };
  byCategory: { id: number; name: string; value: number }[];
  topProducts: { id: number; name: string; image: string | null; revenue: number; units: number }[];
  marginByCategory: { name: string; margin: number }[];
  basket: { labels: string[]; values: number[] };
  /** heatmap[jour 0=lun..6=dim][heure → index] = nb de ventes */
  heatmap: number[][];
  heatmapHours: number[];
  slowMovers: { total: number; rows: SlowMover[] };
}

/** Classement des vendeurs (revendeurs et responsables) sur la période. */
export interface ResellerPerformanceRow {
  id: number;
  name: string;
  revenue: number;
  profit: number;
  salesCount: number;
  units: number;
  /** Part du chiffre d'affaires (%) */
  share: number;
}

export interface ResellerPerformance {
  periodLabel: string;
  rows: ResellerPerformanceRow[];
}
