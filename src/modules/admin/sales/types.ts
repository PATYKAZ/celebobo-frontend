import type { PaymentMethod } from "@/modules/orders/types";
import type { Paginated } from "@/shared/lib/api";

export type { PaymentMethod };

/** shop.models.Vente */
export interface Sale {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  category: string;
  buyer: { id: number; name: string } | null;
  seller: { id: number; name: string } | null;
  dateAchat: string;
  priceFinal: number;
  pricePrimary: number | null;
  /** priceFinal − pricePrimary */
  profit: number;
  method: PaymentMethod;
  venduA: string | null;
  orderId: number | null;
}

export interface SaleInput {
  productId: number;
  priceFinal: number;
  method: PaymentMethod;
  venduA?: string;
  orderId?: number | null;
}

export interface SaleListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  method?: PaymentMethod | "";
  dateFrom?: string;
  dateTo?: string;
  /** "revendeur" = ventes_rev (ventes réalisées par les revendeurs) */
  view?: "all" | "revendeur";
  productId?: number;
}

export interface SalesStats {
  revenue: number;
  profit: number;
  count: number;
  average: number;
}

export type SalePage = Paginated<Sale> & { stats?: SalesStats };

export const METHOD_STYLE: Record<PaymentMethod, { label: string; cls: string }> = {
  OrangeMoney: { label: "Orange Money", cls: "bg-[#FF7900] text-white" },
  AirtelMoney: { label: "Airtel Money", cls: "bg-[#E40000] text-white" },
  "M-Pesa": { label: "M-Pesa", cls: "bg-[#2AAE4A] text-white" },
  Cash: { label: "Cash", cls: "bg-ink-dark text-white" },
};
