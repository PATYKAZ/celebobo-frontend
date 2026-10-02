import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse, type Paginated } from "@/shared/lib/api";
import { channels, realtime, type ConversationEvent } from "@/shared/lib/realtime";
import type { OrderItem } from "@/modules/orders/types";
import { appendMessage, concludeConversation, createSupportConversation, ensureConversation, getMessages, listConversations, markSeen, orderOfConversation, proposePrice, respondProposal, setTyping } from "../mocks/store";
import type { Conversation, Message, PriceProposalInput, SendMessageInput } from "../types";

const unwrap = <T,>(r: Paginated<T> | T[]): T[] => (Array.isArray(r) ? r : r.results);

export const conversationsService = {
  /** Conversations visibles par l'utilisateur courant (client : les siennes ; revendeur : les siennes ; responsable/admin : toutes). */
  async list(): Promise<Conversation[]> {
    if (env.USE_MOCKS) return mockResponse(() => listConversations(), 200);
    return unwrap(await api.get<Paginated<Conversation> | Conversation[]>(ENDPOINTS.conversations.list));
  },

  detail(id: number): Promise<Conversation> {
    if (env.USE_MOCKS) return mockResponse(() => ensureConversation(id), 150);
    return api.get<Conversation>(ENDPOINTS.conversations.detail(id));
  },

  /** Nouvelle discussion de support (conversations/new/). */
  create(): Promise<Conversation> {
    if (env.USE_MOCKS) return mockResponse(() => createSupportConversation(), 300);
    return api.post<Conversation>(ENDPOINTS.conversations.create);
  },

  /** `after` = id du dernier message déjà reçu (récupération incrémentale). */
  async messages(id: number, opts: { after?: number } = {}): Promise<Message[]> {
    if (env.USE_MOCKS) return mockResponse(() => getMessages(id, opts.after), 60);
    return unwrap(await api.get<Paginated<Message> | Message[]>(ENDPOINTS.conversations.messages(id), { params: { after: opts.after } }));
  },

  async send(id: number, input: SendMessageInput): Promise<Message> {
    if (env.USE_MOCKS) {
      const image = input.image ? URL.createObjectURL(input.image) : null;
      return mockResponse(() => appendMessage(id, input.content?.trim() || null, image), 120);
    }
    const form = new FormData();
    if (input.content) form.append("content", input.content);
    if (input.image) form.append("image", input.image);
    return api.post<Message>(ENDPOINTS.conversations.messages(id), form);
  },

  /** Marque la conversation comme lue par l'utilisateur courant (coches « lu » côté interlocuteur). */
  async markSeen(id: number): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => markSeen(id), 40);
    await api.post(`${ENDPOINTS.conversations.detail(id)}seen/`);
  },

  /** Indicateur « écrit… » — temps réel uniquement (aucun appel REST). */
  typing(id: number, typing: boolean, user: { id: number; name: string }): void {
    if (env.USE_MOCKS) return setTyping(id, typing);
    realtime.emit<ConversationEvent>(channels.conversation(id), { type: "typing", userId: user.id, name: user.name, typing });
  },

  /** Lignes de la commande liée à la discussion (lisible par les participants, pas seulement le client). */
  async order(id: number): Promise<{ id: number; items: OrderItem[]; totalPrice: number }> {
    if (env.USE_MOCKS) return mockResponse(() => orderOfConversation(id), 100);
    return api.get(`${ENDPOINTS.conversations.detail(id)}order/`);
  },

  /** Revendeur+ : proposer un prix final pour une ligne de la commande liée. */
  async proposePrice(id: number, input: PriceProposalInput): Promise<Message> {
    if (env.USE_MOCKS) return mockResponse(() => proposePrice(id, input), 250);
    // Contrat API à créer côté Django : POST /conversations/{id}/price-proposals/  { item_id, new_price, reason }
    return api.post<Message>(`${ENDPOINTS.conversations.detail(id)}price-proposals/`, input);
  },

  /** Client : accepter / refuser une proposition (met à jour la ligne de commande côté serveur). */
  async respondProposal(conversationId: number, messageId: number, accept: boolean): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => respondProposal(messageId, accept), 250);
    await api.post(`${ENDPOINTS.conversations.detail(conversationId)}price-proposals/${messageId}/respond/`, { accept });
  },

  /** Utilisé par l'admin (modules/admin/orders) — clôture la discussion liée à une commande. */
  async conclude(id: number): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(() => concludeConversation(id), 200);
    await api.post(ENDPOINTS.admin.conversations.conclude(id));
  },
};
