import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import type { ContactInput, ContactReceipt } from "../types";

let seq = 1041;

export const contactService = {
  /** Envoie le message ; retourne un accusé avec numéro de référence. API : `POST ENDPOINTS.contact.send` → `{ reference }`. */
  async send(input: ContactInput): Promise<ContactReceipt> {
    if (env.USE_MOCKS) {
      // Reproduit la validation serveur (erreurs par champ, comme DRF)
      const errors: Record<string, string[]> = {};
      if (input.message.trim().length < 10) errors.message = ["Le message est trop court."];
      if (!/^S+@S+.S+$/.test(input.email)) errors.email = ["Adresse e-mail invalide."];
      if (Object.keys(errors).length) throw new ApiError(400, "Message invalide", errors);
      return mockResponse({ reference: `CT-${new Date().getFullYear()}-${++seq}`, sentAt: new Date().toISOString() }, 900);
    }
    const res = await api.post<Partial<ContactReceipt>>(ENDPOINTS.contact.send, input);
    return { reference: res.reference ?? "—", sentAt: res.sentAt ?? new Date().toISOString() };
  },
};
