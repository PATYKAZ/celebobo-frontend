import { ENDPOINTS } from "@/config/endpoints";
import { api, uploadMedia } from "@/shared/lib/api";
import { channels, realtime, type ConversationEvent } from "@/shared/lib/realtime";
import type { Conversation, ConversationOrder, Message, NewSupportInput, PriceProposalInput, SendMessageInput } from "../types";
import { toConversation, toConversationOrder, toMessage, type ConversationDto, type MessageDto, type MessagePageDto, type OrderDto } from "./messaging.mapper";

/** Messages chargés à l'ouverture d'une discussion (les plus récents). */
const HISTORY_LIMIT = 100;

/** Pièce jointe : réduite, envoyée à Cloudinary puis enregistrée → URL publique de l'image. */
async function uploadAttachment(file: File): Promise<string> {
  return (await uploadMedia(file, "message_attachment")).url;
}

export const conversationsService = {
  /** Discussions visibles (client : les siennes ; revendeur : assignées ; responsable/admin : toutes), les plus récentes d'abord. */
  async list(): Promise<Conversation[]> {
    const page = await api.page<ConversationDto, Conversation>(ENDPOINTS.conversations.list, { params: { pageSize: 50 } }, toConversation);
    return page.results;
  },

  async detail(id: number): Promise<Conversation> {
    return toConversation(await api.get<ConversationDto>(ENDPOINTS.conversations.detail(id)));
  },

  /** Nouvelle discussion de support (le premier message est obligatoire). */
  async create(input: NewSupportInput): Promise<Conversation> {
    return toConversation(await api.post<ConversationDto>(ENDPOINTS.conversations.create, input));
  },

  /** Derniers messages, dans l'ordre chronologique (l'API renvoie du plus récent au plus ancien). */
  async messages(id: number): Promise<Message[]> {
    const page = await api.get<MessagePageDto>(ENDPOINTS.conversations.messages(id), { params: { limit: HISTORY_LIMIT } });
    return page.results.map(toMessage).reverse();
  },

  async send(id: number, input: SendMessageInput & { clientMsgId?: string }): Promise<Message> {
    const attachment = input.image ? await uploadAttachment(input.image) : "";
    const dto = await api.post<MessageDto>(ENDPOINTS.conversations.messages(id), { body: input.content?.trim() ?? "", attachment, clientMsgId: input.clientMsgId ?? "" });
    return toMessage(dto);
  },

  /** Marque la conversation comme lue jusqu'au message donné (ou jusqu'au dernier). */
  async markSeen(id: number, lastMessageId?: number): Promise<void> {
    await api.post(ENDPOINTS.conversations.read(id), { lastMessageId: lastMessageId ?? null });
  },

  /** Indicateur « écrit… » — temps réel uniquement (aucun appel REST). */
  typing(id: number, typing: boolean, user: { id: number; name: string }): void {
    realtime.emit<ConversationEvent>(channels.conversation(id), { type: "typing", userId: user.id, name: user.name, typing });
  },

  /** Commande liée : lignes ajustables + statut (`/bo/orders/{id}/` pour l'équipe, `/me/orders/{number}/` pour le client). */
  async order(conversation: Pick<Conversation, "relatedOrderId" | "orderNumber">, staff: boolean): Promise<ConversationOrder> {
    const path = staff ? ENDPOINTS.conversations.staffOrder(conversation.relatedOrderId as number) : ENDPOINTS.conversations.clientOrder(conversation.orderNumber as string);
    return toConversationOrder(await api.get<OrderDto>(path));
  },

  /** Revendeur+ : proposer un prix final pour une ligne de la commande liée. */
  async proposePrice(id: number, input: PriceProposalInput): Promise<Message> {
    return toMessage(await api.post<MessageDto>(ENDPOINTS.conversations.proposePrice(id), { itemId: input.itemId, newPrice: input.newPrice.toFixed(2), reason: input.reason ?? "" }));
  },

  /** Client : accepter / refuser une proposition (met à jour la ligne de commande côté serveur). */
  async respondProposal(proposalId: number, accept: boolean): Promise<void> {
    await api.post(ENDPOINTS.conversations.respondProposal(proposalId), { accept });
  },

  /** Revendeur+ : clôturer / rouvrir une discussion. */
  async close(id: number): Promise<Conversation> {
    return toConversation(await api.post<ConversationDto>(ENDPOINTS.conversations.close(id)));
  },

  async reopen(id: number): Promise<Conversation> {
    return toConversation(await api.post<ConversationDto>(ENDPOINTS.conversations.reopen(id)));
  },

  /** Responsable : confier une discussion de support à un revendeur. */
  async assign(id: number, resellerId: number): Promise<Conversation> {
    return toConversation(await api.post<ConversationDto>(ENDPOINTS.conversations.assign(id), { resellerId }));
  },
};
