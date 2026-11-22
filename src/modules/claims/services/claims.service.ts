import { ENDPOINTS } from "@/config/endpoints";
import { api, idempotent, toPaginated, uploadMedia } from "@/shared/lib/api";
import type { PageEnvelope, Paginated } from "@/shared/lib/api/types";
import type { Claim, ClaimableLine, ClaimStatus, Diagnosis, NewClaim, ReturnMethod } from "../types";

const { claims } = ENDPOINTS;

export const claimsService = {
  /** Articles d'une commande livrée et ce qu'ils peuvent encore réclamer. */
  claimable(orderId: number): Promise<ClaimableLine[]> {
    return api.get<ClaimableLine[]>(claims.claimable(orderId));
  },

  /** Photo du défaut, envoyée comme une pièce jointe de message. */
  async uploadPhoto(file: File): Promise<string> {
    return (await uploadMedia(file, "message_attachment")).url;
  },

  submit(input: NewClaim, key: string): Promise<Claim> {
    return api.post<Claim>(claims.mine, input, idempotent(key));
  },

  async mine(page = 1): Promise<Paginated<Claim>> {
    return toPaginated(await api.get<PageEnvelope<Claim>>(claims.mine, { params: { page } }));
  },

  mineDetail(id: number): Promise<Claim> {
    return api.get<Claim>(claims.mineDetail(id));
  },

  // ---- Équipe ----------------------------------------------------------------
  async list(status: ClaimStatus | "all", page = 1): Promise<Paginated<Claim>> {
    const params = { page, ...(status === "all" ? {} : { status }) };
    return toPaginated(await api.get<PageEnvelope<Claim>>(claims.list, { params }));
  },

  detail(id: number): Promise<Claim> {
    return api.get<Claim>(claims.detail(id));
  },

  answer(id: number, returnMethod: ReturnMethod, note: string): Promise<Claim> {
    return api.post<Claim>(claims.step(id, "answer"), { returnMethod, note: note.trim() });
  },

  receive(id: number, sealed: boolean | null, note: string): Promise<Claim> {
    return api.post<Claim>(claims.step(id, "receive"), { sealed, note: note.trim() });
  },

  diagnose(id: number, d: Diagnosis): Promise<Claim> {
    return api.post<Claim>(
      claims.step(id, "diagnose"),
      { covered: d.covered, outcome: d.outcome, note: d.note.trim(), newSerial: d.newSerial.trim(), quote: d.quote || null },
      idempotent(),
    );
  },

  repaired(id: number, note: string): Promise<Claim> {
    return api.post<Claim>(claims.step(id, "repaired"), { note: note.trim() });
  },
};
