import { ENDPOINTS } from "@/config/endpoints";
import { api, type PageEnvelope } from "@/shared/lib/api";
import { money } from "@/modules/products/services/products.mapper";
import type { AdminCoupon, CouponFilter, CouponFormValues, CouponStatus } from "../types";

const { coupons } = ENDPOINTS.admin;

/** `/bo/coupons/` (après camelCase). */
interface CouponDto extends Omit<AdminCoupon, "value" | "maxDiscount" | "minSubtotal" | "discountTotal"> {
  value: string;
  maxDiscount: string | null;
  minSubtotal: string;
  discountTotal: string;
}

const toCoupon = (dto: CouponDto): AdminCoupon => ({
  ...dto,
  value: money(dto.value),
  maxDiscount: dto.maxDiscount == null ? null : money(dto.maxDiscount),
  minSubtotal: money(dto.minSubtotal),
  discountTotal: money(dto.discountTotal),
});

export function couponStatus(c: AdminCoupon, now = new Date()): CouponStatus {
  if (!c.isActive) return "inactive";
  if (c.startsAt && new Date(c.startsAt) > now) return "scheduled";
  if (c.endsAt && new Date(c.endsAt) <= now) return "expired";
  if (c.usageLimit != null && c.uses >= c.usageLimit) return "exhausted";
  return "active";
}

/** Date ISO → valeur d'un champ datetime-local (heure locale). */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export const EMPTY_COUPON: CouponFormValues = {
  code: "",
  description: "",
  kind: "percent",
  value: "",
  maxDiscount: "",
  minSubtotal: "",
  freeShipping: false,
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perUserLimit: "",
  isActive: true,
};

export const couponToForm = (c: AdminCoupon): CouponFormValues => ({
  code: c.code,
  description: c.description,
  kind: c.kind,
  value: String(c.value),
  maxDiscount: c.maxDiscount == null ? "" : String(c.maxDiscount),
  minSubtotal: c.minSubtotal ? String(c.minSubtotal) : "",
  freeShipping: c.freeShipping,
  startsAt: toLocalInput(c.startsAt),
  endsAt: toLocalInput(c.endsAt),
  usageLimit: c.usageLimit == null ? "" : String(c.usageLimit),
  perUserLimit: c.perUserLimit == null ? "" : String(c.perUserLimit),
  isActive: c.isActive,
});

const decimal = (v: string) => v.replace(",", ".").trim();
const optionalNumber = (v: string) => (v.trim() ? Number(v) : null);

const toPayload = (v: CouponFormValues) => ({
  code: v.code.trim().toUpperCase(),
  description: v.description.trim(),
  kind: v.kind,
  value: decimal(v.value),
  // le plafond ne concerne qu'un pourcentage
  maxDiscount: v.kind === "percent" && v.maxDiscount.trim() ? decimal(v.maxDiscount) : null,
  minSubtotal: v.minSubtotal.trim() ? decimal(v.minSubtotal) : "0",
  freeShipping: v.freeShipping,
  startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null,
  endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : null,
  usageLimit: optionalNumber(v.usageLimit),
  perUserLimit: optionalNumber(v.perUserLimit),
  isActive: v.isActive,
});

export const adminCouponsService = {
  /** Les codes promo sont peu nombreux : une page de 100 suffit (les plus récents d'abord). */
  async list(search: string, filter: CouponFilter): Promise<AdminCoupon[]> {
    const params = { search: search.trim() || undefined, active: filter === "all" ? undefined : filter === "active", pageSize: 100 };
    const page = await api.get<PageEnvelope<CouponDto>>(coupons.list, { params });
    return page.results.map(toCoupon);
  },
  async create(v: CouponFormValues): Promise<AdminCoupon> {
    return toCoupon(await api.post<CouponDto>(coupons.list, toPayload(v)));
  },
  async update(id: number, v: CouponFormValues): Promise<AdminCoupon> {
    return toCoupon(await api.patch<CouponDto>(coupons.detail(id), toPayload(v)));
  },
  async setActive(id: number, isActive: boolean): Promise<AdminCoupon> {
    return toCoupon(await api.patch<CouponDto>(coupons.detail(id), { isActive }));
  },
};
