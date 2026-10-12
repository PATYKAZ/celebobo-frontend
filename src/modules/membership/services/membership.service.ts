import { ENDPOINTS } from "@/config/endpoints";
import { api, idempotent } from "@/shared/lib/api";
import { money } from "@/modules/products/services/products.mapper";
import type { MembershipRequest, MyMembership, PaidPlan } from "../types";

/** Demande d'abonnement (après camelCase). */
export interface RequestDto extends Omit<MembershipRequest, "price"> {
  price: string;
}

interface MembershipDto extends Omit<MyMembership, "pendingRequest"> {
  pendingRequest: RequestDto | null;
}

export const toRequest = (dto: RequestDto): MembershipRequest => ({ ...dto, price: money(dto.price) });
const toMembership = (dto: MembershipDto): MyMembership => ({ ...dto, pendingRequest: dto.pendingRequest && toRequest(dto.pendingRequest) });

const { membership } = ENDPOINTS;

export const membershipService = {
  async mine(): Promise<MyMembership> {
    return toMembership(await api.get<MembershipDto>(membership.me));
  },
  /** Démarre l'essai gratuit ; 422 `trial_unavailable` (meta.reason) sinon. Chaque action renvoie l'abonnement à jour. */
  async startTrial(): Promise<MyMembership> {
    return toMembership(await api.post<MembershipDto>(membership.trial, {}));
  },
  /** Demande un abonnement payant au prix du jour ; une seule demande à la fois. */
  async request(plan: PaidPlan, paymentMethod: string): Promise<MyMembership> {
    return toMembership(await api.post<MembershipDto>(membership.requests, { plan, paymentMethod }, idempotent()));
  },
  async cancel(id: number): Promise<MyMembership> {
    return toMembership(await api.post<MembershipDto>(membership.cancel(id), {}));
  },
};
