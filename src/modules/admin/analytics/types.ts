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

export const DEFAULT_FILTERS: AnalyticsFilters = { range: "12m", category: "all", method: "all" };

export interface AnalyticsSummary {
  revenue: number;
  revenueDelta: number;
  profit: number;
  profitDelta: number;
  sales: number;
  salesDelta: number;
  avgBasket: number;
  avgBasketDelta: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  /** Ventes par mois : barres = revenu, ligne = bénéfice */
  monthly: { labels: string[]; revenue: number[]; profit: number[] };
  byCategory: { id: number; name: string; value: number }[];
  topProducts: { id: number; name: string; image: string | null; revenue: number; units: number }[];
  marginByCategory: { name: string; margin: number }[];
  basket: { labels: string[]; values: number[] };
  /** heatmap[jour 0=lun..6=dim][heure 8..21 → index 0..13] = nb de ventes */
  heatmap: number[][];
  heatmapHours: number[];
}
