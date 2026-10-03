import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";

export interface NewsletterResult {
  email: string;
  /** Code de réduction envoyé par e-mail (1ʳᵉ commande) */
  discountCode: string;
  /** Remise du code (%) */
  discount: number;
  /** true si l'adresse était déjà inscrite */
  alreadySubscribed: boolean;
}

/** Réponse de `POST /newsletter/subscribe/` (après camelCase). */
interface SubscriptionDto {
  email: string;
  code: string;
  discount: number;
  alreadySubscribed: boolean;
}

export const newsletterService = {
  /** Inscription ; `source` indique l'emplacement du formulaire (footer, popup…). */
  async subscribe(email: string, source = "footer"): Promise<NewsletterResult> {
    const dto = await api.post<SubscriptionDto>(ENDPOINTS.newsletter.subscribe, { email: email.trim().toLowerCase(), source });
    return { email: dto.email, discountCode: dto.code, discount: dto.discount, alreadySubscribed: dto.alreadySubscribed };
  },

  /** Désinscription via le jeton du lien envoyé par e-mail. */
  async unsubscribe(token: string): Promise<void> {
    await api.post(ENDPOINTS.newsletter.unsubscribe, { token });
  },
};
