"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "@/config/endpoints";
import { api, toPaginated, type PageEnvelope, type Paginated } from "@/shared/lib/api";
import { toRequest, type RequestDto } from "@/modules/membership/services/membership.service";
import type { MembershipRequest, MembershipRequestStatus, MembershipStatus, PaidPlan } from "@/modules/membership/types";

const { membership } = ENDPOINTS.admin;
export const PAGE_SIZE = 20;

export interface MemberRef {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export type AdminMembershipRequest = MembershipRequest & { member: MemberRef };

export interface AdminMember {
  member: MemberRef;
  status: Exclude<MembershipStatus, "none">;
  plan: PaidPlan | "trial";
  endsAt: string;
}

const keys = {
  all: ["admin", "membership"] as const,
  requests: (status: MembershipRequestStatus | "all", page: number) => ["admin", "membership", "requests", status, page] as const,
  members: (status: MembershipStatus | "all", page: number) => ["admin", "membership", "members", status, page] as const,
};

export function useMembershipRequests(status: MembershipRequestStatus | "all", page: number) {
  return useQuery({
    queryKey: keys.requests(status, page),
    queryFn: async (): Promise<Paginated<AdminMembershipRequest>> =>
      toPaginated(
        await api.get<PageEnvelope<RequestDto & { member: MemberRef }>>(membership.requests, { params: { status: status === "all" ? undefined : status, page, pageSize: PAGE_SIZE } }),
        (dto) => ({ ...toRequest(dto), member: dto.member }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useMembers(status: MembershipStatus | "all", page: number) {
  return useQuery({
    queryKey: keys.members(status, page),
    queryFn: async () => toPaginated(await api.get<PageEnvelope<AdminMember>>(membership.members, { params: { status: status === "all" ? undefined : status, page, pageSize: PAGE_SIZE } })),
    placeholderData: keepPreviousData,
  });
}

/** Confirmer (paiement reçu) ou refuser une demande : demandes, membres et notifications à recharger. */
export function useHandleRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: "confirm" | "reject"; note?: string }) =>
      action === "confirm" ? api.post(membership.confirm(id), {}) : api.post(membership.reject(id), { note: note?.trim() ?? "" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
