import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { listConversations } from "@/modules/messaging/mocks/store";
import type { Availability } from "@/modules/messaging/types";
import { availableTransitions } from "@/modules/orders/services/workflow.service";
import { nextOrderStatus, type OrderStatus } from "@/modules/orders/types";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { channels, realtime, type PresenceEvent } from "@/shared/lib/realtime";
import { DB, fullName, userById } from "@/shared/mock-db";
import { commissionFor, getActor, inPeriod, invitedBy, pctChange, periodMonth, productOf, resellerStats, saleTotal, totals } from "@/shared/mock-db/selectors";
import type { MyInvitesData, MyResellerStats, ResellerDashboardData } from "../types";

const FINAL: OrderStatus[] = ["livree", "annulee", "retournee"];

function buildDashboard(): ResellerDashboardData {
  const me = getActor();
  const u = userById(me.id);
  const cur = periodMonth(0);
  const prev = periodMonth(-1);
  const mine = DB.sales.filter((s) => s.sellerId === me.id);
  const now = totals(mine.filter((s) => inPeriod(s, cur)));
  const before = totals(mine.filter((s) => inPeriod(s, prev)));
  const orders = DB.orders.filter((o) => o.assignedRevendeur?.id === me.id);
  const convs = listConversations();
  const byStatus: ResellerDashboardData["orders"]["byStatus"] = {};
  orders.forEach((o) => {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  });
  const comm = commissionFor(me.id);

  return {
    period: { label: cur.label, previousLabel: prev.label },
    availability: (u?.availability ?? "online") as Availability,
    code: u?.codeRevendeur ?? "",
    invitedCount: invitedBy(me.id).length,
    orders: { assigned: orders.length, open: orders.filter((o) => !FINAL.includes(o.status)).length, byStatus },
    awaitingReply: convs.filter((c) => c.awaitingReply).length,
    sales: { revenue: now.revenue, previousRevenue: before.revenue, delta: pctChange(now.revenue, before.revenue), count: now.count, profit: now.profit },
    commission: { rate: comm.rate, earned: comm.earned, paid: comm.paid, due: comm.due },
    openOrders: orders
      .filter((o) => !FINAL.includes(o.status))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8)
      .map((o) => {
        const next = nextOrderStatus(o.status);
        return {
          id: o.id,
          createdAt: o.createdAt,
          status: o.status,
          clientName: o.user.name,
          total: o.totalPrice,
          itemsSummary: o.items.map((i) => `${i.productName}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", "),
          conversationId: o.conversationId,
          unread: convs.find((c) => c.id === o.conversationId)?.unreadCount ?? 0,
          nextStatus: next && availableTransitions(me, o).includes(next) ? next : null,
        };
      }),
    recentSales: mine
      .filter((s) => s.status === "valide")
      .slice(0, 6)
      .map((s) => ({ id: s.id, productName: productOf(s.productId)?.name ?? "Produit", productImage: productOf(s.productId)?.image ?? null, quantity: s.quantity, total: saleTotal(s), soldAt: s.soldAt, method: s.method })),
  };
}

function buildInvites(): MyInvitesData {
  const me = getActor();
  const u = userById(me.id);
  const rows = invitedBy(me.id).map((c) => {
    const orders = DB.orders.filter((o) => o.user.id === c.id && o.status !== "annulee");
    return { id: c.id, name: fullName(c), email: c.email, joinedAt: c.joinedAt, ordersCount: orders.length, ordersTotal: orders.reduce((n, o) => n + o.totalPrice, 0) };
  });
  return { code: u?.codeRevendeur ?? "", invitedCount: rows.length, ordersTotal: rows.reduce((n, r) => n + r.ordersTotal, 0), invited: rows.sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt)) };
}

export const resellerSpaceService = {
  dashboard(): Promise<ResellerDashboardData> {
    if (env.USE_MOCKS) return mockResponse(buildDashboard, 250);
    return api.get<ResellerDashboardData>(ENDPOINTS.admin.me.dashboard);
  },

  invites(): Promise<MyInvitesData> {
    if (env.USE_MOCKS) return mockResponse(buildInvites, 250);
    return api.get<MyInvitesData>(ENDPOINTS.admin.me.invites);
  },

  /** Disponibilité (en ligne / absent / hors ligne) — diffusée en temps réel (canal presence). */
  async setAvailability(availability: Availability): Promise<Availability> {
    if (env.USE_MOCKS) {
      const me = userById(getActor().id);
      if (!me || me.role !== "revendeur") throw new ApiError(403, "Réservé aux revendeurs.");
      me.availability = availability;
      realtime.emit<PresenceEvent>(channels.presence, { type: "availability", userId: me.id, availability });
      return mockResponse(availability, 150);
    }
    const r = await api.patch<{ availability: Availability }>(ENDPOINTS.admin.resellersAdmin.availability, { availability });
    return r.availability;
  },

  /** Code + nombre d'invités du revendeur connecté (source unique : base de démo / API). */
  async myStats(): Promise<MyResellerStats> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const id = getActor().id;
        const u = userById(id);
        const isReseller = u?.role === "revendeur";
        return { code: isReseller ? (u?.codeRevendeur ?? null) : null, invitedCount: isReseller ? resellerStats(id).invitedCount : 0 };
      }, 100);
    }
    const d = await api.get<MyInvitesData>(ENDPOINTS.admin.me.invites);
    return { code: d.code, invitedCount: d.invitedCount };
  },
};
