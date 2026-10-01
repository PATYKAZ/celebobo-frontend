import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse, type Paginated } from "@/shared/lib/api";
import { appendMessage, concludeConversation, createSupportConversation, ensureConversation, getMessages, listConversations } from "../mocks/store";
import type { Conversation, Message, SendMessageInput } from "../types";

const unwrap = <T,>(r: Paginated<T> | T[]): T[] => (Array.isArray(r) ? r : r.results);

export const conversationsService = {
  async list(): Promise<Conversation[]> {
    if (env.USE_MOCKS) return mockResponse(() => listConversations(), 300);
    return unwrap(await api.get<Paginated<Conversation> | Conversation[]>(ENDPOINTS.conversations.list));
  },

  detail(id: number): Promise<Conversation> {
    if (env.USE_MOCKS) return mockResponse(() => ensureConversation(id), 250);
    return api.get<Conversation>(ENDPOINTS.conversations.detail(id));
  },

  /** Nouvelle discussion de support (conversations/new/). */
  create(): Promise<Conversation> {
    if (env.USE_MOCKS) return mockResponse(() => createSupportConversation(), 350);
    return api.post<Conversation>(ENDPOINTS.conversations.create);
  },

  /** `after` = id du dernier message déjà reçu (polling incrémental). */
  async messages(id: number, opts: { after?: number } = {}): Promise<Message[]> {
    if (env.USE_MOCKS) return mockResponse(() => getMessages(id, opts.after), 150);
    return unwrap(await api.get<Paginated<Message> | Message[]>(ENDPOINTS.conversations.messages(id), { params: { after: opts.after } }));
  },

  async send(id: number, input: SendMessageInput): Promise<Message> {
    if (env.USE_MOCKS) {
      const image = input.image ? URL.createObjectURL(input.image) : null;
      return mockResponse(() => appendMessage(id, input.content?.trim() || null, image), 250);
    }
    const form = new FormData();
    if (input.content) form.append("content", input.content);
    if (input.image) form.append("image", input.image);
    return api.post<Message>(ENDPOINTS.conversations.messages(id), form);
  },

  /** Utilisé par l'admin (modules/admin/orders) — clôture la discussion liée à une commande. */
  async conclude(id: number): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => concludeConversation(id), 300);
    await api.post(ENDPOINTS.admin.conversations.conclude(id));
  },
};
