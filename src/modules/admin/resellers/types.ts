import type { Paginated } from "@/shared/lib/api";
import type { ResellerAvailability as Availability } from "@/modules/auth/types";
import type { PeriodKey } from "../dashboard/lib/period";

export type { Availability };

export interface InvitedClient {
  id: number;
  name: string;
  email: string;
  joinedAt: string;
  ordersCount: number;
}

/** Revendeur + clients invités via son code. Ventes = période demandée ; charge et invités = fiche détaillée. */
export interface Reseller {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  codeRevendeur: string;
  invitedCount: number;
  /** Chiffre d'affaires généré sur la période demandée */
  salesTotal: number;
  salesCount: number;
  ordersAssigned: number;
  ordersOpen: number;
  conversionRate: number;
  joinedAt: string;
  status: "actif" | "inactif";
  availability: Availability;
  /** 0.07 = 7 % */
  commissionRate: number;
  invited: InvitedClient[];
}

export type ResellerOrdering = "-joined" | "joined" | "-invited" | "-sales" | "name";

export interface ResellerListParams {
  search?: string;
  ordering?: ResellerOrdering;
  status?: "all" | "actif" | "inactif";
  /** période des « ventes générées » (défaut 30d) */
  period?: PeriodKey;
  page?: number;
  pageSize?: number;
}

export interface ResellersResponse extends Paginated<Reseller> {
  periodLabel: string;
  stats: { total: number; active: number; invited: number; topId: number | null; topName: string | null; topSales: number };
}

export interface CreateResellerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  /** 0.07 = 7 % (défaut 7 %) */
  commissionRate?: number;
}

export const AVAILABILITY_LABEL: Record<Availability, string> = { online: "En ligne", away: "Absent", offline: "Hors ligne" };
export const AVAILABILITY_DOT: Record<Availability, string> = { online: "bg-primary", away: "bg-star", offline: "bg-ink-3" };
