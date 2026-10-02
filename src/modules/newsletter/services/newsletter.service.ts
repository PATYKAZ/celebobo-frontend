import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";

export interface NewsletterResult {
  email: string;
  /** Code de réduction envoyé par e-mail (10 % sur la 1ʳᵉ commande) */
  discountCode: string;
  /** true si l'adresse était déjà inscrite */
  alreadySubscribed: boolean;
}

/** Abonnés (mock, en mémoire). */
const subscribers = new Set<string>(["client@celebobo.com"]);

export const newsletterService = {
  /**
   * Inscription à la newsletter. API : `POST ENDPOINTS.newsletter.subscribe { email }`
   * → `{ discountCode, alreadySubscribed }`.
   */
  async subscribe(email: string): Promise<NewsletterResult> {
    const clean = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(clean)) throw new ApiError(400, "Adresse e-mail invalide", { email: ["Adresse e-mail invalide."] });
    if (env.USE_MOCKS) {
      const already = subscribers.has(clean);
      subscribers.add(clean);
      return mockResponse({ email: clean, discountCode: "BIENVENUE10", alreadySubscribed: already }, 700);
    }
    return api.post<NewsletterResult>(ENDPOINTS.newsletter.subscribe, { email: clean });
  },
};
