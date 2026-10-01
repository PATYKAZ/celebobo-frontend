import { MOCK_ORDERS } from "@/modules/orders/mocks/orders";
import type { PaymentMethod } from "@/modules/orders/types";
import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import type { DashboardData, DashboardPeriod } from "../types";
import { dayLabel, monthLabel, pct, rng, todayKey } from "./seeded";

const METHODS: PaymentMethod[] = ["OrangeMoney", "AirtelMoney", "M-Pesa", "Cash"];
const BUYERS = ["Aline Mbuyi", "Chancelle Bakole", "Jonathan Luzolo", "Merveille Tuta", "Patrick Ilunga", "Grâce Kalala", "Dieudonné Mpia"];

export function buildDashboard(period: DashboardPeriod): DashboardData {
  const r = rng(`${todayKey()}-dash-${period}`);
  const now = new Date();
  const monthly = period === "12m";
  const count = period === "7d" ? 7 : period === "30d" ? 30 : 12;

  const labels: string[] = [];
  const revenue: number[] = [];
  const profit: number[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (monthly) d.setMonth(d.getMonth() - i);
    else d.setDate(d.getDate() - i);
    labels.push(monthly ? monthLabel(d) : dayLabel(d));
    const trend = 1 + ((count - i) / count) * 0.35;
    const base = monthly ? 9500 : 420;
    const rev = Math.round(base * trend * (0.55 + r() * 0.9));
    revenue.push(rev);
    profit.push(Math.round(rev * (0.18 + r() * 0.12)));
  }

  const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
  const monthRevenue = monthly ? revenue[revenue.length - 1] : Math.round(sum(revenue.slice(-30)) || sum(revenue) * 4);
  const prevMonth = Math.round(monthRevenue * (0.78 + r() * 0.2));
  const dayRevenue = revenue[revenue.length - 1] && !monthly ? revenue[revenue.length - 1] : Math.round(380 + r() * 300);
  const prevDay = Math.round(dayRevenue * (0.75 + r() * 0.4));
  const profitNow = Math.round(monthRevenue * 0.23);
  const profitPrev = Math.round(prevMonth * 0.21);
  const monthSales = Math.round(monthRevenue / 310);
  const sharePrev = 38 + r() * 6;
  const share = sharePrev + (r() * 8 - 2);

  const methodWeights = [0.34, 0.24, 0.3, 0.12];
  const methods = METHODS.map((m, i) => ({ method: m, total: Math.round(sum(revenue) * methodWeights[i] * (0.9 + r() * 0.2)) }));

  const top = [...MOCK_PRODUCTS].sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0)).slice(0, 5).map((p) => {
    const units = Math.round((p.salesCount ?? 10) * (period === "12m" ? 1 : period === "30d" ? 0.35 : 0.1) + 2);
    return { id: p.id, name: p.name, image: p.image, units, revenue: units * (p.priceSolde ?? p.price) };
  });

  const recentSales = Array.from({ length: 8 }, (_, i) => {
    const p = MOCK_PRODUCTS[Math.floor(r() * MOCK_PRODUCTS.length)];
    return {
      id: 9000 - i,
      productName: p.name,
      productImage: p.image,
      buyer: BUYERS[Math.floor(r() * BUYERS.length)],
      method: METHODS[Math.floor(r() * METHODS.length)],
      priceFinal: p.priceSolde ?? p.price,
      date: new Date(Date.now() - i * (3 + r() * 5) * 3600000).toISOString(),
    };
  });

  const pendingOrders = MOCK_ORDERS.filter((o) => o.status === "attente").map((o) => ({
    id: o.id,
    buyer: o.user.name,
    total: o.totalPrice,
    createdAt: o.createdAt,
    conversationId: o.conversationId,
    itemsCount: o.items.reduce((s, i) => s + i.quantity, 0),
  }));

  return {
    kpis: {
      monthRevenue,
      monthRevenueDelta: pct(monthRevenue, prevMonth),
      profit: profitNow,
      profitDelta: pct(profitNow, profitPrev),
      dayRevenue,
      dayRevenueDelta: pct(dayRevenue, prevDay),
      monthSales,
      monthSalesDelta: pct(monthSales, Math.round(prevMonth / 310)),
      smartphonesShare: share,
      smartphonesDelta: pct(share, sharePrev),
      pendingOrders: pendingOrders.length,
    },
    series: { labels, revenue, profit },
    methods,
    topProducts: top,
    recentSales,
    pendingOrders,
  };
}
