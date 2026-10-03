import { ENDPOINTS } from "@/config/endpoints";
import { api, downloadJob, idempotent, runJob, type Job, type PageEnvelope } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { PAYMENT_TO_API, toOrder, type OrderDto } from "@/modules/orders/services/orders.mapper";
import type { Order } from "@/modules/orders/types";
import type { ConvertibleOrder, ConvertOrderInput, RefundInput, Sale, SaleInput, SaleListParams, SalePage } from "../types";
import { STATUS_TO_API, toSale, toStats, type SaleDto, type SaleStatsDto } from "./sales.mapper";

const { sales, orders, users } = ENDPOINTS.admin;

interface ConvertibleOrderDto {
  id: number;
  number: string;
  status: OrderDto["status"];
  clientName: string;
  total: string;
  createdAt: string;
  convertible: boolean;
  blockedReason: string | null;
  itemsCount: number;
}

const toFilters = (p: SaleListParams) => ({
  search: p.search || undefined,
  paymentMethod: p.method ? PAYMENT_TO_API[p.method] : undefined,
  status: p.status ? STATUS_TO_API[p.status] : undefined,
  period: p.preset ? `${p.preset}d` : undefined,
  dateFrom: p.dateFrom || undefined,
  dateTo: p.dateTo || undefined,
  sellerId: p.sellerId ?? undefined,
  productId: p.productId,
});

function periodLabel(p: SaleListParams) {
  if (p.preset) return `${p.preset} derniers jours`;
  if (p.dateFrom || p.dateTo) return `${p.dateFrom ? formatDate(p.dateFrom) : "…"} → ${p.dateTo ? formatDate(p.dateTo) : "aujourd'hui"}`;
  return "Toute la période";
}

const toSaleBody = (input: SaleInput) => ({
  productId: input.productId,
  variantId: input.variantId ?? null,
  quantity: input.quantity,
  unitPrice: input.unitPrice.toFixed(2),
  paymentMethod: PAYMENT_TO_API[input.method],
  soldAt: input.soldAt,
  soldTo: input.venduA ?? "",
});

/** Motifs de blocage renvoyés par l'API (codes) → libellés. */
const BLOCKED_LABEL: Record<string, string> = {
  already_converted: "Déjà convertie en ventes",
  cancelled: "Commande annulée",
  returned: "Commande retournée",
  no_products: "Aucun produit à convertir",
};
const blockedLabel = (code: string | null) => (code ? (BLOCKED_LABEL[code] ?? code) : null);

/** Résumé de la recherche de conversion → commande partielle (les lignes viennent de la fiche, cf. `convertible`). */
const toConvertible = (dto: ConvertibleOrderDto): ConvertibleOrder => ({
  order: toOrder({ ...dto, previewName: "", previewImage: "", resellerName: null }),
  convertible: dto.convertible,
  blockedReason: blockedLabel(dto.blockedReason),
  convertedAt: null,
});

export const salesService = {
  async list(params: SaleListParams = {}): Promise<SalePage> {
    const page = await api.page<SaleDto, Sale>(sales.list, { params: { ...toFilters(params), page: params.page, pageSize: params.pageSize } }, toSale);
    return { ...page, stats: toStats(page.meta?.stats as SaleStatsDto | undefined), periodLabel: periodLabel(params) };
  },

  /** Vendeurs proposés dans le filtre : revendeurs et responsables. */
  async sellers(): Promise<{ id: number; name: string }[]> {
    const pages = await Promise.all(
      ["reseller", "manager"].map((role) => api.get<PageEnvelope<{ id: number; name: string }>>(users.list, { params: { role, pageSize: 100 } })),
    );
    return pages.flatMap((p) => p.results.map((u) => ({ id: u.id, name: u.name }))).sort((a, b) => a.name.localeCompare(b.name));
  },

  async detail(id: number): Promise<Sale> {
    return toSale(await api.get<SaleDto>(sales.detail(id)));
  },

  async create(input: SaleInput): Promise<Sale> {
    return toSale(await api.post<SaleDto>(sales.list, toSaleBody(input), idempotent()));
  },

  async createMany(inputs: SaleInput[]): Promise<Sale[]> {
    return (await api.post<SaleDto[]>(sales.bulk, { lines: inputs.map(toSaleBody) }, idempotent())).map(toSale);
  },

  /** Le produit et la quantité d'une vente ne se modifient pas : prix, paiement, date et acheteur seulement. */
  async update(id: number, input: SaleInput): Promise<Sale> {
    const body = toSaleBody(input);
    return toSale(await api.patch<SaleDto>(sales.detail(id), { unitPrice: body.unitPrice, paymentMethod: body.paymentMethod, soldAt: body.soldAt, soldTo: body.soldTo }));
  },

  async remove(id: number): Promise<void> {
    await api.delete(sales.detail(id));
  },

  async refund(id: number, input: RefundInput): Promise<Sale> {
    return toSale(await api.post<SaleDto>(sales.refund(id), { kind: input.type === "retour" ? "return" : "refund", amount: input.amount.toFixed(2), reason: input.reason.trim() }, idempotent()));
  },

  /** Par n° de commande, nom ou e-mail du client ; sans requête : commandes récentes convertibles. */
  async searchOrders(q: string): Promise<ConvertibleOrder[]> {
    return (await api.get<ConvertibleOrderDto[]>(orders.convertible, { params: { search: q.trim().replace(/^#/, "") || undefined } })).map(toConvertible);
  },

  /** Fiche complète (lignes) + état de conversion d'une commande. */
  async convertible(orderId: number): Promise<ConvertibleOrder> {
    const order = toOrder(await api.get<OrderDto>(orders.detail(orderId)));
    const match = (await api.get<ConvertibleOrderDto[]>(orders.convertible, { params: { search: order.number } })).find((o) => o.id === orderId);
    return { order, convertible: match?.convertible ?? false, blockedReason: match ? blockedLabel(match.blockedReason) : "Commande non convertible.", convertedAt: null };
  },

  /** Convertit une commande en ventes : 1 vente par ligne (quantité conservée). */
  async convertOrder(orderId: number, input: ConvertOrderInput): Promise<{ sales: Sale[]; order: Order }> {
    const created = await api.post<SaleDto[]>(orders.convertToSales(orderId), {
      paymentMethod: PAYMENT_TO_API[input.method],
      soldAt: input.soldAt,
      soldTo: input.venduA ?? "",
      lines: input.lines.map((l) => ({ itemId: l.itemId, unitPrice: l.unitPrice.toFixed(2) })),
    }, idempotent());
    return { sales: created.map(toSale), order: toOrder(await api.get<OrderDto>(orders.detail(orderId))) };
  },

  /** Export des ventes filtrées (tâche asynchrone de l'API), téléchargé une fois prêt. */
  async export(format: "csv" | "xlsx" | "pdf", params: SaleListParams): Promise<void> {
    const { period, ...filters } = toFilters(params);
    const exportable = period && ["2d", "7d", "30d", "90d"].includes(period) ? period : undefined;
    downloadJob(await runJob(api.post<Job>(sales.export, { format, period: exportable, ...filters })));
  },
};
