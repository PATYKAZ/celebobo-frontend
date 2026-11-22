import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { ConsentKind, ConsentOverview } from "../types";

export const consentsService = {
  overview: () => api.get<ConsentOverview>(ENDPOINTS.consents.list),
  /** Donne un ou plusieurs consentements (une nouvelle version de la politique s'accepte de la même façon). */
  give: (kinds: ConsentKind[]) => api.post<ConsentOverview>(ENDPOINTS.consents.list, { kinds }),
  /** Retire un consentement : aussi simple que de le donner. */
  withdraw: (kind: ConsentKind) => api.delete<ConsentOverview>(ENDPOINTS.consents.detail(kind)),
};
