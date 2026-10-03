import { ENDPOINTS } from "@/config/endpoints";
import { api, ApiError } from "@/shared/lib/api";
import type { TrackedOrder, TrackingQuery } from "../types";
import { toTrackedOrder, type TrackingDto } from "./tracking.mapper";

export const trackingService = {
  /**
   * Suivi public sans compte : numéro + e-mail/téléphone de l'acheteur.
   * 404 si aucune correspondance — même réponse pour « inconnue » et « contact erroné ».
   */
  async lookup(q: TrackingQuery): Promise<TrackedOrder> {
    const number = q.number.trim().replace(/^#/, "").toUpperCase();
    const contact = q.contact.trim();
    if (!number) throw new ApiError(400, "Numéro invalide", { errors: { number: ["Entrez votre numéro de commande (ex : CB-7KQ2-M9XA)."] } });
    if (!contact) throw new ApiError(400, "Contact requis", { errors: { contact: ["Entrez l'e-mail ou le téléphone utilisé à la commande."] } });
    return toTrackedOrder(await api.post<TrackingDto>(ENDPOINTS.tracking.lookup, { number, contact }));
  },
};
