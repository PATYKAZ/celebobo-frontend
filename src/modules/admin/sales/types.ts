import type { Order, PaymentMethod } from "@/modules/orders/types";
import type { Paginated } from "@/shared/lib/api";
import type { SaleStatus } from "@/shared/mock-db/types";

export type { PaymentMethod, SaleStatus };

/**
 * Vente (shop.models.Vente v2).
 * v1 : `seller` = Vente.utilisateur = VENDEUR (revendeur / responsable) ; `venduA` = acheteur en texte libre.
 */
export interface Sale {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  category: string;
  seller: { id: number; name: string } | null;
  /** Compte client acheteur si la vente vient d'une commande */
  buyer: { id: number; name: string } | null;
  venduA: string | null;
  quantity: number;
  /** price_final unitaire */
  unitPrice: number;
  /** unitPrice × quantity */
  total: number;
  pricePrimary: number | null;
  /** total − coût d'achat × quantité */
  profit: number;
  /** date_achat (ISO) */
  dateAchat: string;
  /** date_enregistrement (ISO) */
  dateEnregistrement: string;
  method: PaymentMethod;
  status: SaleStatus;
  refund: { amount: number; reason: string; at: string; by: string } | null;
  orderId: number | null;
}

export interface SaleInput {
  productId: number;
  quantity: number;
  /** price_final unitaire */
  unitPrice: number;
  method: PaymentMethod;
  /** date_achat au format yyyy-mm-dd */
  soldAt: string;
  venduA?: string;
}

export interface SaleListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  method?: PaymentMethod | "";
  status?: SaleStatus | "";
  /** Raccourci v1 : ventes des N derniers jours */
  preset?: "" | "2" | "7" | "30" | "90";
  /** date_achat (yyyy-mm-dd) */
  dateFrom?: string;
  dateTo?: string;
  /** date_enregistrement exacte (yyyy-mm-dd) */
  recordedOn?: string;
  /** "revendeur" = ventes_rev (ventes réalisées par les revendeurs) — responsable/admin */
  view?: "all" | "revendeur";
  sellerId?: number | null;
  productId?: number;
}

export interface SalesStats {
  revenue: number;
  profit: number;
  /** lignes de vente valides */
  count: number;
  units: number;
  average: number;
}

export type SalePage = Paginated<Sale> & { stats: SalesStats; periodLabel: string };

export interface RefundInput {
  type: "remboursement" | "retour";
  amount: number;
  reason: string;
}

/** Commande proposée à la conversion (v1 : search_orders_by_user). */
export interface ConvertibleOrder {
  order: Order;
  convertible: boolean;
  blockedReason: string | null;
  /** Date de conversion si déjà convertie */
  convertedAt: string | null;
}

export interface ConvertOrderInput {
  lines: { itemId: number; unitPrice: number }[];
  method: PaymentMethod;
  /** yyyy-mm-dd */
  soldAt: string;
  venduA?: string;
}

export const METHOD_STYLE: Record<PaymentMethod, { label: string; cls: string }> = {
  OrangeMoney: { label: "Orange Money", cls: "bg-[#FF7900] text-white" },
  AirtelMoney: { label: "Airtel Money", cls: "bg-[#E40000] text-white" },
  "M-Pesa": { label: "M-Pesa", cls: "bg-[#2AAE4A] text-white" },
  Cash: { label: "Cash", cls: "bg-ink-dark text-white" },
};

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  valide: "Valide",
  remboursée: "Remboursée",
  retournée: "Retournée",
};

export const PRESET_LABEL: Record<NonNullable<SaleListParams["preset"]>, string> = {
  "": "Toute la période",
  "2": "2 jours",
  "7": "7 jours",
  "30": "30 jours",
  "90": "90 jours",
};
