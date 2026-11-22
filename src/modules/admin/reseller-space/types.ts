import type { Availability } from "@/modules/messaging/types";
import type { OrderStatus, PaymentMethod } from "@/modules/orders/types";

export interface ResellerOpenOrder {
  id: number;
  createdAt: string;
  status: OrderStatus;
  clientName: string;
  total: number;
  itemsSummary: string;
  conversationId: number | null;
  /** messages non lus dans la discussion liée */
  unread: number;
  /** prochaine étape autorisée pour moi (null = aucune) */
  nextStatus: OrderStatus | null;
}

export interface ResellerRecentSale {
  id: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  total: number;
  soldAt: string;
  method: PaymentMethod;
}

/** Données du tableau de bord revendeur (GET /me/dashboard/). Toutes les périodes sont explicites. */
export interface ResellerDashboardData {
  period: { label: string; previousLabel: string };
  availability: Availability;
  code: string;
  invitedCount: number;
  orders: { assigned: number; open: number; byStatus: Partial<Record<OrderStatus, number>> };
  /** discussions dont le dernier message vient du client */
  awaitingReply: number;
  sales: { revenue: number; previousRevenue: number; delta: number | null; count: number; profit: number };
  commission: { earned: number; paid: number; due: number };
  openOrders: ResellerOpenOrder[];
  recentSales: ResellerRecentSale[];
}

/** Un client invité, vu par son revendeur : ni e-mail ni achats (politique de confidentialité §4). */
export interface InvitedClientRow {
  id: number;
  name: string;
  joinedAt: string;
  /** Fin des 12 mois de parrainage (null si la date d'invitation est inconnue). */
  referralEndsAt: string | null;
  /** Ses achats rapportent encore des points de parrainage. */
  referralActive: boolean;
}

/** GET /bo/me/invitees/ */
export interface MyInvitesData {
  code: string;
  invitedCount: number;
  /** Invités encore dans leurs 12 mois de parrainage (parmi ceux chargés). */
  activeCount: number;
  invited: InvitedClientRow[];
}

/** Statistiques légères réutilisables ailleurs (profil, en-tête…) — toujours lues dans la source unique. */
export interface MyResellerStats {
  code: string | null;
  invitedCount: number;
}
