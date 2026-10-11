import { ENDPOINTS } from "@/config/endpoints";
import { api, ApiError } from "@/shared/lib/api";
import { toProduct, type ProductCardDto } from "@/modules/products/services/products.mapper";
import type { AssistantReply } from "../types";

/** Réponse complète de `POST /assistant/sessions/{id}/messages/?stream=false` (après camelCase). */
interface ReplyDto {
  content: string;
  products: ProductCardDto[];
  error: { code: string; detail: string } | null;
}

/** Échec annoncé par le serveur dans la réponse (HTTP 200) ; `code` (hérité) du type `assistant_unavailable`. */
export class AssistantError extends ApiError {
  constructor(code: string, detail: string) {
    super(503, detail, { code, detail });
    this.name = "AssistantError";
  }
}

export const assistantService = {
  /** Ouvre une session (anonyme ou liée au compte connecté). */
  async open(): Promise<string> {
    return (await api.post<{ id: string }>(ENDPOINTS.assistant.sessions)).id;
  },

  async ask(sessionId: string, content: string): Promise<AssistantReply> {
    // le modèle peut appeler la recherche produits jusqu'à 2 fois (≤ 30 s chacune côté serveur) ;
    // nginx accorde 120 s à l'assistant : 25 s par défaut couperait des réponses en cours
    const res = await api.post<ReplyDto>(ENDPOINTS.assistant.messages(sessionId), { content }, { params: { stream: false }, timeoutMs: 90_000 });
    // erreur propre à l'assistant (modèle saturé, quota du jour…) : message du serveur, destiné à l'utilisateur
    if (res.error && !res.content) throw new AssistantError(res.error.code, res.error.detail);
    return { reply: res.content, products: res.products.map(toProduct) };
  },

  async close(sessionId: string): Promise<void> {
    await api.delete(ENDPOINTS.assistant.session(sessionId));
  },
};
