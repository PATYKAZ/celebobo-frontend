"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { conversationsService } from "../services/conversations.service";
import type { Message, SendMessageInput } from "../types";

export const messagingKeys = {
  conversations: ["conversations"] as const,
  conversation: (id: number) => ["conversations", id] as const,
  messages: (id: number) => ["conversations", id, "messages"] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: messagingKeys.conversations,
    queryFn: conversationsService.list,
    refetchInterval: 8000,
  });
}

export function useConversation(id: number | null | undefined) {
  return useQuery({
    queryKey: messagingKeys.conversation(id ?? 0),
    queryFn: () => conversationsService.detail(id as number),
    enabled: !!id,
  });
}

/** Messages d'une conversation. Polling ~4 s, récupération incrémentale (`after` = dernier id). */
export function useMessages(id: number | null | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: messagingKeys.messages(id ?? 0),
    enabled: !!id,
    refetchInterval: 4000,
    queryFn: async () => {
      const key = messagingKeys.messages(id as number);
      const prev = qc.getQueryData<Message[]>(key) ?? [];
      const lastReal = [...prev].reverse().find((m) => m.id > 0)?.id;
      const fresh = await conversationsService.messages(id as number, { after: lastReal });
      if (!lastReal) return fresh;
      const optimistic = prev.filter((m) => m.id < 0);
      const known = new Set(prev.map((m) => m.id));
      const added = fresh.filter((m) => !known.has(m.id));
      // les messages optimistes déjà confirmés par le serveur sont retirés
      const stillPending = optimistic.filter((o) => !added.some((a) => a.content === o.content && a.sender.id === o.sender.id));
      return [...prev.filter((m) => m.id > 0), ...added, ...stillPending];
    },
  });
}

/** Envoi avec mise à jour optimiste. */
export function useSendMessage(id: number) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = messagingKeys.messages(id);

  return useMutation({
    mutationFn: (input: SendMessageInput) => conversationsService.send(id, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Message[]>(key) ?? [];
      const temp: Message = {
        id: -Date.now(),
        conversationId: id,
        sender: { id: user?.id ?? 0, name: user?.firstName ?? "Moi", avatar: user?.avatar ?? null, role: user?.role ?? "client" },
        content: input.content?.trim() || null,
        image: input.image ? URL.createObjectURL(input.image) : null,
        timestamp: new Date().toISOString(),
        seen: false,
      };
      qc.setQueryData<Message[]>(key, [...prev, temp]);
      return { prev, tempId: temp.id };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(key, ctx.prev),
    onSuccess: (msg, _v, ctx) => {
      qc.setQueryData<Message[]>(key, (cur = []) => cur.map((m) => (m.id === ctx?.tempId ? msg : m)));
      qc.invalidateQueries({ queryKey: messagingKeys.conversations });
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: conversationsService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: messagingKeys.conversations }),
  });
}

/** Total des messages non lus (badge header si besoin). */
export function useUnreadMessagesCount() {
  const { data } = useConversations();
  return data?.reduce((n, c) => n + c.unreadCount, 0) ?? 0;
}
