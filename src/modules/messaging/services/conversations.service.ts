import { ENDPOINTS } from "@/config/endpoints";
import { api, ApiError } from "@/shared/lib/api";
import { channels, realtime, type ConversationEvent } from "@/shared/lib/realtime";
import type { Conversation, ConversationOrder, Message, NewSupportInput, PriceProposalInput, SendMessageInput } from "../types";
import { toConversation, toConversationOrder, toMessage, type ConversationDto, type MessageDto, type MessagePageDto, type OrderDto } from "./messaging.mapper";

/** Messages chargés à l'ouverture d'une discussion (les plus récents). */
const HISTORY_LIMIT = 100;

interface UploadSignature {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  transformation: string;
  maxBytes: number;
}

/** Envoi direct vers Cloudinary (signature serveur) puis enregistrement côté API → URL publique de l'image. */
async function uploadAttachment(file: File): Promise<string> {
  const sig = await api.post<UploadSignature>(ENDPOINTS.conversations.uploadSign, { purpose: "message_attachment" });
  if (file.size > sig.maxBytes) throw new ApiError(400, "Image trop lourde (5 Mo maximum).");
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("allowed_formats", sig.allowedFormats);
  form.append("transformation", sig.transformation);
  const res = await fetch(sig.uploadUrl, { method: "POST", body: form }).catch(() => null);
  if (!res?.ok) throw new ApiError(res?.status ?? 0, "Envoi de l'image impossible.");
  const up = (await res.json()) as { public_id: string; version: number; signature: string; format: string; bytes: number; width?: number; height?: number };
  const media = await api.post<{ url: string }>(ENDPOINTS.conversations.uploadComplete, {
    purpose: "message_attachment",
    publicId: up.public_id,
    version: up.version,
    signature: up.signature,
    format: up.format,
    bytes: up.bytes,
    width: up.width ?? null,
    height: up.height ?? null,
  });
  return media.url;
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
