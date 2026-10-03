import { ENDPOINTS } from "@/config/endpoints";
import { api, type PageEnvelope } from "@/shared/lib/api";
import type { ProfileDto } from "@/modules/auth/services/auth.mapper";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { conversationsService } from "@/modules/messaging/services/conversations.service";
import type { Availability } from "@/modules/messaging/types";
import { money } from "@/modules/products/services/products.mapper";
import { PAYMENT_FROM_API, STATUS_FROM_API, toOrder, type OrderSummaryDto } from "@/modules/orders/services/orders.mapper";
import { availableTransitions } from "@/modules/orders/services/workflow.service";
import { nextOrderStatus, ORDER_FINAL, type OrderStatus } from "@/modules/orders/types";
import { periodLabels, type RecentSaleDto, type SummaryDto } from "../../dashboard/services/dashboard.mapper";
import type { CommissionSummaryDto } from "../../commissions/services/commissions.mapper";
import type { InviteeDto } from "../../resellers/services/resellers.mapper";
import type { MyInvitesData, MyResellerStats, ResellerDashboardData } from "../types";

const { dashboard, orders, commissions, me } = ENDPOINTS.admin;
const OPEN_ORDERS_SHOWN = 8;

/** Compteurs par statut de l'API → statuts du front. */
function byStatus(raw: Record<string, number> = {}): Partial<Record<OrderStatus, number>> {
  const out: Partial<Record<OrderStatus, number>> = {};
  for (const [status, n] of Object.entries(raw)) {
    const front = STATUS_FROM_API[status as keyof typeof STATUS_FROM_API];
    if (front && n) out[front] = n;
  }
  return out;
}

export const resellerSpaceService = {
  /** Tableau de bord du revendeur connecté (l'API limite chaque liste à ses commandes et ventes). */
  async dashboard(): Promise<ResellerDashboardData> {
    const actor = useAuthStore.getState().user;
    const [profile, summary, list, recent, commission, conversations] = await Promise.all([
      api.get<ProfileDto>(ENDPOINTS.auth.me),
      api.get<SummaryDto>(dashboard.summary, { params: { period: "30d" } }),
      api.get<PageEnvelope<OrderSummaryDto>>(orders.list, { params: { pageSize: 30 } }),
      api.get<RecentSaleDto[]>(dashboard.recentSales),
      api.get<CommissionSummaryDto>(commissions.summary),
      conversationsService.list(),
    ]);
    const counts = byStatus(list.meta.counts as Record<string, number> | undefined);
    const labels = periodLabels("30d", summary.start, summary.end);
    const total = (statuses: OrderStatus[]) => statuses.reduce((n, s) => n + (counts[s] ?? 0), 0);
    const all = Object.keys(counts) as OrderStatus[];
    return {
      period: { label: labels.periodLabel, previousLabel: labels.previousPeriodLabel },
      availability: profile.reseller?.availability ?? "offline",
      code: profile.reseller?.referralCode ?? "",
      invitedCount: profile.reseller?.invitedCount ?? 0,
      orders: { assigned: total(all), open: total(all.filter((s) => !ORDER_FINAL.includes(s))), byStatus: counts },
      awaitingReply: conversations.filter((c) => c.awaitingReply).length,
      sales: {
        revenue: money(summary.revenue.value),
        previousRevenue: money(summary.revenue.previous),
        delta: summary.revenue.change,
        count: Number(summary.salesCount.value),
        profit: money(summary.profit.value),
      },
      commission: { rate: Number(commission.rate), earned: money(commission.earnedTotal), paid: money(commission.paidTotal), due: money(commission.due) },
      openOrders: list.results
        .map(toOrder)
        .filter((o) => !ORDER_FINAL.includes(o.status))
        .slice(0, OPEN_ORDERS_SHOWN)
        .map((o) => {
          const next = nextOrderStatus(o.status);
          const conversation = conversations.find((c) => c.relatedOrderId === o.id);
          return {
            id: o.id,
            createdAt: o.createdAt,
            status: o.status,
            clientName: o.user.name,
            total: o.totalPrice,
            itemsSummary: `${o.previewName ?? "Commande"}${(o.itemsCount ?? 1) > 1 ? ` +${(o.itemsCount ?? 1) - 1}` : ""}`,
            conversationId: conversation?.id ?? null,
            unread: conversation?.unreadCount ?? 0,
            nextStatus: next && availableTransitions(actor, o).includes(next) ? next : null,
          };
        }),
      recentSales: recent.slice(0, 6).map((s) => ({
        id: s.id,
        productName: s.productName,
        productImage: s.productImage || null,
        quantity: s.quantity,
        total: money(s.total),
        soldAt: s.soldAt,
        method: PAYMENT_FROM_API[s.paymentMethod],
      })),
    };
  },

  async invites(): Promise<MyInvitesData> {
    const [referral, page] = await Promise.all([
      api.get<{ code: string }>(me.referral),
      api.get<PageEnvelope<InviteeDto>>(me.invitees, { params: { pageSize: 100 } }),
    ]);
    const invited = page.results.map((i) => ({ id: i.id, name: i.name, email: i.email, joinedAt: i.joinedAt, ordersCount: i.ordersCount, ordersTotal: money(i.ordersTotal) }));
    return { code: referral.code, invitedCount: page.meta.count, ordersTotal: invited.reduce((n, r) => n + r.ordersTotal, 0), invited };
  },

  /** Disponibilité (en ligne / absent / hors ligne) — diffusée en temps réel par l'API (canal presence). */
  async setAvailability(availability: Availability): Promise<Availability> {
    const profile = await api.patch<ProfileDto>(me.availability, { availability });
    return profile.reseller?.availability ?? availability;
  },

  /** Code + nombre d'invités du revendeur connecté. */
  async myStats(): Promise<MyResellerStats> {
    const profile = await api.get<ProfileDto>(ENDPOINTS.auth.me);
    return { code: profile.reseller?.referralCode ?? null, invitedCount: profile.reseller?.invitedCount ?? 0 };
  },
};
