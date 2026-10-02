import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import type { ResellerApplicationInput, ResellerApplicationReceipt } from "../types";

let seq = 200;
/** Candidatures reçues (mock, en mémoire) — visibles côté admin quand le module sera branché. */
export const MOCK_APPLICATIONS: (ResellerApplicationInput & ResellerApplicationReceipt)[] = [];

export const resellerApplicationService = {
  /** API : `POST ENDPOINTS.resellerApplication.submit` → `{ reference }`. */
  async submit(input: ResellerApplicationInput): Promise<ResellerApplicationReceipt> {
    if (env.USE_MOCKS) {
      const errors: Record<string, string[]> = {};
      if (input.fullName.trim().length < 3) errors.fullName = ["Entrez votre nom complet."];
      if (!/^[+\d][\d\s().-]{7,}$/.test(input.phone.trim())) errors.phone = ["Numéro de téléphone invalide."];
      if (!/^\S+@\S+\.\S+$/.test(input.email)) errors.email = ["Adresse e-mail invalide."];
      if (input.motivation.trim().length < 20) errors.motivation = ["Décrivez votre projet en quelques phrases (20 caractères minimum)."];
      if (Object.keys(errors).length) throw new ApiError(400, "Candidature invalide", errors);
      const receipt = { reference: `REV-${new Date().getFullYear()}-${++seq}`, submittedAt: new Date().toISOString() };
      MOCK_APPLICATIONS.unshift({ ...input, ...receipt });
      return mockResponse(receipt, 900);
    }
    const res = await api.post<Partial<ResellerApplicationReceipt>>(ENDPOINTS.resellerApplication.submit, input);
    return { reference: res.reference ?? "—", submittedAt: res.submittedAt ?? new Date().toISOString() };
  },
};
