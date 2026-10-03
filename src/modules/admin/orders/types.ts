import type { ResellerAvailability } from "@/modules/auth/types";
import type { Order, OrderStatus } from "@/modules/orders/types";
import type { Paginated } from "@/shared/lib/api";

/** Onglet de la liste : un statut, « all » ou « unassigned » (aucun revendeur). */
export type OrderTab = OrderStatus | "all" | "unassigned";

export interface AdminOrderListParams {
  status?: OrderTab;
  page?: number;
  pageSize?: number;
  /** client, n° de commande */
  search?: string;
  resellerId?: number;
  /** ISO date (yyyy-mm-dd) */
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export type AdminOrderCounts = Record<OrderTab, number>;

export interface AdminOrderKpis {
  /** commandes en attente d'assignation */
  toAssign: number;
  /** commandes en cours (assignée → en livraison) */
  inProgress: number;
  deliveredThisMonth: number;
  /** ex. « octobre 2026 » */
  periodLabel: string;
}

export interface AdminOrderPage extends Paginated<Order> {
  counts: AdminOrderCounts;
  kpis: AdminOrderKpis;
}

/** Revendeur proposé dans le sélecteur d'assignation. */
export interface ResellerOption {
  id: number;
  name: string;
  code: string;
  avatar: string | null;
  active: boolean;
  availability: ResellerAvailability;
  /** commandes ouvertes (non clôturées) déjà assignées */
  openOrders: number;
}
