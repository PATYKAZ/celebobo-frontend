/** Code promo du back-office (`/bo/coupons/`). */
export type CouponKind = "percent" | "fixed";

export interface AdminCoupon {
  id: number;
  code: string;
  description: string;
  kind: CouponKind;
  /** Pourcentage (≤ 100) ou montant en $ */
  value: number;
  /** Plafond de la remise d'un pourcentage (null : sans plafond) */
  maxDiscount: number | null;
  minSubtotal: number;
  freeShipping: boolean;
  startsAt: string | null;
  endsAt: string | null;
  /** Utilisations au total (null : illimité) */
  usageLimit: number | null;
  /** Utilisations par client (null : illimité) */
  perUserLimit: number | null;
  isActive: boolean;
  /** Commandes qui l'ont utilisé (hors annulées) et remise accordée au total */
  uses: number;
  discountTotal: number;
  createdAt: string;
}

/** État affiché, déduit des dates, du nombre d'utilisations et de l'activation. */
export type CouponStatus = "active" | "scheduled" | "expired" | "exhausted" | "inactive";

export interface CouponFormValues {
  code: string;
  description: string;
  kind: CouponKind;
  value: string;
  maxDiscount: string;
  minSubtotal: string;
  freeShipping: boolean;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perUserLimit: string;
  isActive: boolean;
}

export type CouponFilter = "all" | "active" | "inactive";
