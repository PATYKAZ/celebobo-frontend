import type { Product } from "./types";

export interface Pricing {
  /** Prix à payer (soldé si promo). */
  current: number;
  /** Ancien prix (barré) si promo, sinon null. */
  original: number | null;
  onSale: boolean;
  /** Économie en $ */
  saving: number;
  percent: number;
}

export function getPricing(p: Pick<Product, "price" | "priceSolde" | "soldePercent">): Pricing {
  const onSale = p.priceSolde != null && p.priceSolde < p.price;
  const current = onSale ? (p.priceSolde as number) : p.price;
  const saving = onSale ? p.price - current : 0;
  return {
    current,
    original: onSale ? p.price : null,
    onSale,
    saving,
    percent: onSale ? Math.round(p.soldePercent ?? (saving / p.price) * 100) : 0,
  };
}

export const isNew = (p: Pick<Product, "currentBadge">) => p.currentBadge === "Nouveauté";
