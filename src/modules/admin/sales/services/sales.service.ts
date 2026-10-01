import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse, nextMockId, paginate } from "@/shared/lib/api";
import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import { MOCK_ORDERS } from "@/modules/orders/mocks/orders";
import type { Order } from "@/modules/orders/types";
import { MOCK_SALES } from "../mocks/sales";
import type { Sale, SaleInput, SaleListParams, SalePage, SalesStats } from "../types";

function build(input: SaleInput, id: number, date?: string): Sale {
  const p = MOCK_PRODUCTS.find((x) => x.id === input.productId);
  if (!p) throw new ApiError(400, "Produit introuvable", { productId: ["Produit introuvable."] });
  const order = input.orderId ? MOCK_ORDERS.find((o) => o.id === input.orderId) : null;
  return {
    id,
    productId: p.id,
    productName: p.name,
    productImage: p.image,
    category: p.category,
    buyer: order ? { id: order.user.id, name: order.user.name } : null,
    seller: null,
    dateAchat: date ?? new Date().toISOString(),
    priceFinal: input.priceFinal,
    pricePrimary: p.pricePrimary ?? null,
    profit: input.priceFinal - (p.pricePrimary ?? 0),
    method: input.method,
    venduA: input.venduA?.trim() || order?.user.name || null,
    orderId: input.orderId ?? null,
  };
}

function statsOf(list: Sale[]): SalesStats {
  const revenue = list.reduce((s, x) => s + x.priceFinal, 0);
  return { revenue, profit: list.reduce((s, x) => s + x.profit, 0), count: list.length, average: list.length ? revenue / list.length : 0 };
}

function filter(p: SaleListParams): Sale[] {
  let list = [...MOCK_SALES].sort((a, b) => +new Date(b.dateAchat) - +new Date(a.dateAchat));
  if (p.search) {
    const q = p.search.toLowerCase();
    list = list.filter((s) => `${s.productName} ${s.buyer?.name ?? ""} ${s.venduA ?? ""}`.toLowerCase().includes(q));
  }
  if (p.method) list = list.filter((s) => s.method === p.method);
  if (p.dateFrom) list = list.filter((s) => +new Date(s.dateAchat) >= +new Date(p.dateFrom as string));
  if (p.dateTo) list = list.filter((s) => +new Date(s.dateAchat) <= +new Date(p.dateTo as string) + 86399999);
  if (p.view === "revendeur") list = list.filter((s) => s.seller);
  if (p.productId) list = list.filter((s) => s.productId === p.productId);
  return list;
}

export const salesService = {
  list(params: SaleListParams = {}): Promise<SalePage> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const list = filter(params);
        return { ...paginate(list, params.page ?? 1, params.pageSize ?? 10), stats: statsOf(list) };
      }, 300);
    }
    return api.get<SalePage>(ENDPOINTS.admin.sales.list, { params: params as never });
  },

  async detail(id: number): Promise<Sale> {
    if (env.USE_MOCKS) {
      const s = MOCK_SALES.find((x) => x.id === id);
      if (!s) throw new ApiError(404, "Vente introuvable");
      return mockResponse(s, 250);
    }
    return api.get<Sale>(ENDPOINTS.admin.sales.detail(id));
  },

  async create(input: SaleInput): Promise<Sale> {
    if (env.USE_MOCKS) {
      const s = build(input, nextMockId());
      MOCK_SALES.unshift(s);
      return mockResponse(s, 500);
    }
    return api.post<Sale>(ENDPOINTS.admin.sales.create, input);
  },

  async bulk(inputs: SaleInput[]): Promise<{ created: number }> {
    if (env.USE_MOCKS) {
      inputs.forEach((i) => MOCK_SALES.unshift(build(i, nextMockId())));
      return mockResponse({ created: inputs.length }, 600);
    }
    return api.post<{ created: number }>(ENDPOINTS.admin.sales.bulk, { sales: inputs });
  },

  async update(id: number, input: SaleInput): Promise<Sale> {
    if (env.USE_MOCKS) {
      const idx = MOCK_SALES.findIndex((x) => x.id === id);
      if (idx < 0) throw new ApiError(404, "Vente introuvable");
      MOCK_SALES[idx] = build(input, id, MOCK_SALES[idx].dateAchat);
      return mockResponse(MOCK_SALES[idx], 500);
    }
    return api.patch<Sale>(ENDPOINTS.admin.sales.update(id), input);
  },

  async remove(id: number): Promise<void> {
    if (env.USE_MOCKS) {
      const idx = MOCK_SALES.findIndex((x) => x.id === id);
      if (idx >= 0) MOCK_SALES.splice(idx, 1);
      return mockResponse(undefined, 350);
    }
    await api.delete(ENDPOINTS.admin.sales.remove(id));
  },

  /** Recherche de commandes d'un client (ex-`search_orders_by_user`). */
  searchOrders(q: string): Promise<Order[]> {
    if (env.USE_MOCKS) {
      const s = q.toLowerCase();
      return mockResponse(() => MOCK_ORDERS.filter((o) => `${o.user.name} ${o.user.email ?? ""} #${o.id}`.toLowerCase().includes(s)).slice(0, 6), 200);
    }
    return api.get<Order[]>(ENDPOINTS.admin.sales.searchOrders, { params: { user: q } });
  },

  /** URL d'export (Excel/PDF) avec les filtres courants. */
  exportUrl(kind: "excel" | "pdf", params: SaleListParams): string {
    const { page: _p, pageSize: _s, ...filters } = params;
    void _p;
    void _s;
    return api.url(kind === "excel" ? ENDPOINTS.admin.sales.exportExcel : ENDPOINTS.admin.sales.exportPdf, filters as never);
  },
};
