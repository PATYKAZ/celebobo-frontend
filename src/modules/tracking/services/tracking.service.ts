import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { DB } from "@/shared/mock-db";
import type { TrackedOrder, TrackingQuery } from "../types";

const digits = (s: string) => s.replace(/\D/g, "");

export const trackingService = {
  /**
   * Suivi public sans compte : numéro + e-mail/téléphone de l'acheteur.
   * API : `GET ENDPOINTS.tracking.lookup?number=&contact=` → TrackedOrder (404 si aucune correspondance —
   * même message pour « inconnue » et « contact erroné », pour ne pas révéler l'existence d'une commande).
   */
  async lookup(q: TrackingQuery): Promise<TrackedOrder> {
    const id = Number(q.number.replace(/[^\d]/g, ""));
    if (!id) throw new ApiError(400, "Numéro invalide", { number: ["Entrez un numéro de commande valide (ex : 42)."] });
    if (!q.contact.trim()) throw new ApiError(400, "Contact requis", { contact: ["Entrez l'e-mail ou le téléphone utilisé à la commande."] });

    if (env.USE_MOCKS) {
      const o = DB.orders.find((x) => x.id === id);
      const c = q.contact.trim().toLowerCase();
      const buyer = o && DB.users.find((u) => u.id === o.user.id);
      const matches = !!o && !!buyer && (buyer.email.toLowerCase() === c || (digits(c).length >= 6 && digits(buyer.phoneNumber ?? "").endsWith(digits(c).slice(-6))));
      if (!o || !matches) throw new ApiError(404, "Aucune commande ne correspond à ces informations.");
      return mockResponse<TrackedOrder>(
        {
          id: o.id,
          createdAt: o.createdAt,
          status: o.status,
          totalPrice: o.totalPrice,
          // Noms du personnel masqués dans la vue publique
          statusHistory: o.statusHistory.map((h) => ({ ...h, by: { id: 0, name: h.by.role === "client" ? "Vous" : "Équipe Celebobo", role: h.by.role } })),
          items: o.items.map((i) => ({ name: i.productName, quantity: i.quantity, variantLabel: i.variantLabel })),
        },
        700,
      );
    }
    return api.get<TrackedOrder>(ENDPOINTS.tracking.lookup, { params: { number: id, contact: q.contact.trim() } });
  },
};
