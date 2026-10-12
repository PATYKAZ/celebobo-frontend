import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { money } from "@/modules/products/services/products.mapper";
import type { AdminDeal, DealFormValues, DealStatus } from "../types";

const { deals } = ENDPOINTS.admin;

/** `/bo/deals/` (après camelCase). */
interface DealDto extends Omit<AdminDeal, "dealPrice" | "regularPrice"> {
  dealPrice: string;
  regularPrice: string;
}

const toDeal = (dto: DealDto): AdminDeal => ({ ...dto, dealPrice: money(dto.dealPrice), regularPrice: money(dto.regularPrice) });

/** Date ISO → valeur d'un champ datetime-local (heure locale). */
export const toLocalInput = (iso: string | Date) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

/** Nouvelle offre : de maintenant à ce soir 23 h 59. */
export function emptyDeal(): DealFormValues {
  const end = new Date();
  end.setHours(23, 59, 0, 0);
  return { productId: null, variantId: null, dealPrice: "", startsAt: toLocalInput(new Date()), endsAt: toLocalInput(end), quantity: "", giftLabel: "", isActive: true };
}

export const dealToForm = (d: AdminDeal): DealFormValues => ({
  productId: d.product.id,
  variantId: d.variantId,
  dealPrice: String(d.dealPrice),
  startsAt: toLocalInput(d.startsAt),
  endsAt: toLocalInput(d.endsAt),
  quantity: d.quantity == null ? "" : String(d.quantity),
  giftLabel: d.giftLabel,
  isActive: d.isActive,
});

const toPayload = (v: DealFormValues) => ({
  variantId: v.variantId,
  dealPrice: v.dealPrice.replace(",", ".").trim(),
  startsAt: new Date(v.startsAt).toISOString(),
  endsAt: new Date(v.endsAt).toISOString(),
  quantity: v.quantity.trim() ? Number(v.quantity) : null,
  giftLabel: v.giftLabel.trim(),
  isActive: v.isActive,
});

const ORDER: Record<DealStatus, number> = { live: 0, scheduled: 1, ended: 2 };

export const adminDealsService = {
  /** En cours d'abord, puis programmées (la plus proche en premier), puis terminées (la plus récente en premier). */
  async list(status?: DealStatus): Promise<AdminDeal[]> {
    const rows = (await api.get<DealDto[]>(deals.list, { params: status ? { status } : undefined })).map(toDeal);
    return rows.sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.status === "ended" ? b.endsAt.localeCompare(a.endsAt) : a.startsAt.localeCompare(b.startsAt)));
  },
  async create(v: DealFormValues): Promise<AdminDeal> {
    return toDeal(await api.post<DealDto>(deals.list, { productId: v.productId, ...toPayload(v) }));
  },
  async update(id: number, v: DealFormValues): Promise<AdminDeal> {
    return toDeal(await api.patch<DealDto>(deals.detail(id), toPayload(v)));
  },
  async patch(id: number, patch: { isActive: boolean }): Promise<AdminDeal> {
    return toDeal(await api.patch<DealDto>(deals.detail(id), patch));
  },
  async remove(id: number): Promise<void> {
    await api.delete(deals.detail(id));
  },
};
