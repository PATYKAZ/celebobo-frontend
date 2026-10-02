import { DB } from "@/shared/mock-db";
import { isValidSale, productOf, saleTotal, topReseller, visibleSales } from "@/shared/mock-db/selectors";
import { DAY } from "@/shared/mock-db/rng";
import { pctChange } from "@/shared/mock-db/selectors";
import { buckets, byMethod, categoryOfSale, compare, periodOf, previousPeriod, salesIn, seriesFor, topProducts, userName } from "../lib/stats";
import type { DashboardData, DashboardPeriod } from "../types";

const SMARTPHONES = 1;

/** Tableau de bord = agrégations sur la base de démo unique (mêmes chiffres que Ventes / Revendeurs). */
export function buildDashboard(key: DashboardPeriod): DashboardData {
  const period = periodOf(key);
  const prev = previousPeriod(period);
  const all = visibleSales();
  const inP = salesIn(all, period);
  const cmp = compare(all, period);

  const mode = key === "12m" ? "month" : key === "30d" ? "day" : "day";
  const series = seriesFor(inP, buckets(period, mode));

  // Dernières 24 h vs 24 h précédentes
  const now = Date.now();
  const last24 = all.filter((s) => isValidSale(s) && +new Date(s.soldAt) > now - DAY).reduce((n, s) => n + saleTotal(s), 0);
  const prev24 = all.filter((s) => isValidSale(s) && +new Date(s.soldAt) <= now - DAY && +new Date(s.soldAt) > now - 2 * DAY).reduce((n, s) => n + saleTotal(s), 0);

  const share = (list: typeof all) => {
    const rev = list.filter(isValidSale).reduce((n, s) => n + saleTotal(s), 0);
    const ph = list.filter((s) => isValidSale(s) && categoryOfSale(s) === SMARTPHONES).reduce((n, s) => n + saleTotal(s), 0);
    return rev > 0 ? (ph / rev) * 100 : 0;
  };
  const shareNow = share(inP);
  const sharePrev = share(salesIn(all, prev));

  const pending = DB.orders.filter((o) => o.status === "attente").sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const recent = all.filter(isValidSale).slice(0, 8).map((s) => ({
    id: s.id,
    productName: productOf(s.productId)?.name ?? `Produit #${s.productId}`,
    productImage: productOf(s.productId)?.image ?? null,
    buyer: s.soldTo ?? "Client comptoir",
    seller: userName(s.sellerId),
    method: s.method,
    priceFinal: saleTotal(s),
    date: s.soldAt,
  }));

  return {
    periodKey: key,
    periodLabel: period.label,
    previousPeriodLabel: prev.label,
    kpis: {
      revenue: Math.round(cmp.now.revenue),
      revenueDelta: cmp.revenueDelta,
      profit: Math.round(cmp.now.profit),
      profitDelta: cmp.profitDelta,
      dayRevenue: Math.round(last24),
      dayRevenueDelta: pctChange(last24, prev24),
      sales: cmp.now.count,
      salesDelta: cmp.countDelta,
      smartphonesShare: shareNow,
      smartphonesDelta: sharePrev > 0 ? pctChange(shareNow, sharePrev) : null,
      pendingOrders: pending.length,
      unassignedOrders: pending.filter((o) => !o.assignedRevendeur).length,
    },
    series,
    methods: byMethod(inP),
    topProducts: topProducts(inP, 5),
    recentSales: recent,
    pendingOrders: pending.slice(0, 5).map((o) => ({
      id: o.id,
      buyer: o.user.name,
      total: o.totalPrice,
      createdAt: o.createdAt,
      conversationId: o.conversationId,
      itemsCount: o.items.reduce((s, i) => s + i.quantity, 0),
      assignedTo: o.assignedRevendeur?.name ?? null,
    })),
    topReseller: topReseller(period),
  };
}
