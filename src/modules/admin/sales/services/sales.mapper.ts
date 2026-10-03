import { money } from "@/modules/products/services/products.mapper";
import { PAYMENT_FROM_API, type ApiPaymentMethod } from "@/modules/orders/services/orders.mapper";
import type { Sale, SalesStats, SaleStatus } from "../types";

/** Vente du back-office (après camelCase). */
export interface SaleDto {
  id: number;
  productId: number;
  variantId: number | null;
  productName: string;
  variantLabel: string;
  productImage: string;
  quantity: number;
  unitPrice: string;
  unitCost: string | null;
  total: string;
  refundedAmount: string;
  profit: string | null;
  paymentMethod: ApiPaymentMethod;
  status: ApiSaleStatus;
  soldTo: string;
  buyer: { id: number; name: string } | null;
  seller: { id: number; name: string };
  orderId: number | null;
  orderNumber: string | null;
  soldAt: string;
  recordedAt: string;
  refunds?: { id: number; kind: "refund" | "return"; amount: string; reason: string; by: { id: number; name: string } | null; createdAt: string }[];
}

export type ApiSaleStatus = "valid" | "refunded" | "returned";

export interface SaleStatsDto {
  revenue: string;
  profit: string;
  count: number;
  units: number;
  average: string;
}

export const STATUS_FROM_API: Record<ApiSaleStatus, SaleStatus> = { valid: "valide", refunded: "remboursée", returned: "retournée" };
export const STATUS_TO_API = Object.fromEntries(Object.entries(STATUS_FROM_API).map(([api, front]) => [front, api])) as Record<SaleStatus, ApiSaleStatus>;

export function toSale(dto: SaleDto): Sale {
  const refund = dto.refunds?.[0];
  return {
    id: dto.id,
    productId: dto.productId,
    productName: dto.variantLabel ? `${dto.productName} — ${dto.variantLabel}` : dto.productName,
    productImage: dto.productImage || null,
    category: "",
    seller: dto.seller,
    buyer: dto.buyer,
    venduA: dto.soldTo || null,
    quantity: dto.quantity,
    unitPrice: money(dto.unitPrice),
    total: money(dto.total),
    pricePrimary: dto.unitCost == null ? null : money(dto.unitCost),
    profit: money(dto.profit),
    dateAchat: dto.soldAt,
    dateEnregistrement: dto.recordedAt,
    method: PAYMENT_FROM_API[dto.paymentMethod],
    status: STATUS_FROM_API[dto.status],
    refund: refund
      ? { amount: money(refund.amount), reason: refund.reason, at: refund.createdAt, by: refund.by?.name ?? "—" }
      : dto.status !== "valid"
        ? { amount: money(dto.refundedAmount), reason: "", at: dto.recordedAt, by: "—" }
        : null,
    orderId: dto.orderId,
  };
}

export const toStats = (dto?: SaleStatsDto): SalesStats => ({
  revenue: money(dto?.revenue),
  profit: money(dto?.profit),
  count: dto?.count ?? 0,
  units: dto?.units ?? 0,
  average: money(dto?.average),
});
