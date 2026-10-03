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

export const assistantService = {
  /** Ouvre une session (anonyme ou liée au compte connecté). */
  async open(): Promise<string> {
    return (await api.post<{ id: string }>(ENDPOINTS.assistant.sessions)).id;
  },

  async ask(sessionId: string, content: string): Promise<AssistantReply> {
    const res = await api.post<ReplyDto>(ENDPOINTS.assistant.messages(sessionId), { content }, { params: { stream: false } });
    if (res.error && !res.content) throw new ApiError(502, res.error.detail, res.error);
    return { reply: res.content, products: res.products.map(toProduct) };
  },

  async close(sessionId: string): Promise<void> {
    await api.delete(ENDPOINTS.assistant.session(sessionId));
  },
};
