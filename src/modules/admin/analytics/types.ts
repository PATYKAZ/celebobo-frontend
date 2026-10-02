import type { PaymentMethod } from "@/modules/orders/types";
import type { Availability } from "@/shared/mock-db/types";

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

export interface SlowMover {
  id: number;
  name: string;
  image: string | null;
  category: string;
  stock: number;
  /** stock × prix d'achat */
  stockValue: number;
  /** null = jamais vendu */
  daysSinceLastSale: number | null;
  unitsSold60d: number;
  /** « Devrait être vendu avant le » */
  dateWish: string | null;
  /** jours restants (négatif = dépassé) */
  dateWishDays: number | null;
  reasons: ("rotation" | "echeance")[];
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
  /** Valeur du stock (prix d'achat) dans le temps, reconstruite depuis les mouvements de stock */
  stockValue: { label: string; labels: string[]; values: number[]; current: number; first: number };
  slowMovers: { total: number; rows: SlowMover[] };
}

export interface ResellerPerformanceRow {
  id: number;
  name: string;
  avatar: string | null;
  availability: Availability;
  active: boolean;
  ordersAssigned: number;
  ordersDelivered: number;
  /** % de commandes assignées menées à terme */
  conversionRate: number;
  /** délai moyen de première réponse, en minutes */
  avgResponseMinutes: number;
  revenue: number;
  salesCount: number;
}

export interface ResellerPerformance {
  periodLabel: string;
  rows: ResellerPerformanceRow[];
}
