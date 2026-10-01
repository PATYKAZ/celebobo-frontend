import type { Paginated } from "@/shared/lib/api";

export interface InvitedClient {
  id: number;
  name: string;
  email: string;
  joinedAt: string;
  ordersCount: number;
}

/** Revendeur (groupe Django « revendeur ») + clients invités via son code. */
export interface Reseller {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  codeRevendeur: string;
  invitedCount: number;
  salesTotal: number;
  joinedAt: string;
  status: "actif" | "inactif";
  invited: InvitedClient[];
}

export type ResellerOrdering = "-joined" | "joined" | "-invited" | "-sales" | "name";

export interface ResellerListParams {
  search?: string;
  ordering?: ResellerOrdering;
  page?: number;
  pageSize?: number;
}

export interface ResellersResponse extends Paginated<Reseller> {
  stats: { total: number; invited: number; topName: string | null; topSales: number };
}
