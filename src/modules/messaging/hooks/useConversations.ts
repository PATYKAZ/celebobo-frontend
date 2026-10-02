"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/config/env";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useRealtime } from "@/shared/hooks/useRealtime";
import { channels, type ConversationEvent, type PresenceEvent, type UserEvent } from "@/shared/lib/realtime";
import { conversationsService } from "../services/conversations.service";
import { MESSAGING_CHANNEL, type Message, type MessagingEvent, type PriceProposalInput, type SendMessageInput } from "../types";

export const messagingKeys = {
  conversations: ["conversations"] as const,
  conversation: (id: number) => ["conversations", id] as const,
  messages: (id: number) => ["conversations", id, "messages"] as const,
};

/** Repli polling : uniquement en mode API (en mock tout passe par le temps réel). */
const POLL = (ms: number) => (env.USE_MOCKS ? false : ms);

/** Conversations visibles + mise à jour instantanée (nouveau message, lu, présence, assignation). */
export function useConversations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const query = useQuery({ queryKey: messagingKeys.conversations, queryFn: conversationsService.list, refetchInterval: POLL(15000) });
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: messagingKeys.conversations, exact: true }), [qc]);
  useRealtime<MessagingEvent>(MESSAGING_CHANNEL, refresh);
  useRealtime<UserEvent>(user ? channels.user(user.id) : null, refresh);
  useRealtime<PresenceEvent>(channels.presence, refresh);
  return query;
}

export function useConversation(id: number | null | undefined) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: messagingKeys.conversation(id ?? 0), queryFn: () => conversationsService.detail(id as number), enabled: !!id, retry: false });
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: messagingKeys.conversation(id ?? 0), exact: true }), [qc, id]);
  useRealtime<MessagingEvent>(id ? MESSAGING_CHANNEL : null, (e) => {
    if (e.conversationId === id) refresh();
  });
  useRealtime<PresenceEvent>(id ? channels.presence : null, refresh);
  return query;
}

/** Messages d'une conversation : rafraîchis à chaque événement temps réel (message, lu), polling seulement en API. */
export function useMessages(id: number | null | undefined) {
  const qc = useQueryClient();
  const key = messagingKeys.messages(id ?? 0);
  const query = useQuery({
    queryKey: key,
    enabled: !!id,
    refetchInterval: POLL(6000),
    queryFn: async () => {
      const fresh = await conversationsService.messages(id as number);
      const prev = qc.getQueryData<Message[]>(key) ?? [];
      // les messages optimistes déjà confirmés par le serveur sont retirés
      const pending = prev.filter(
        (m) => m.id < 0 && !fresh.some((f) => f.sender.id === m.sender.id && f.content === m.content && Math.abs(+new Date(f.timestamp) - +new Date(m.timestamp)) < 5 * 60000),
      );
      return [...fresh, ...pending];
    },
  });
  useRealtime<ConversationEvent>(id ? channels.conversation(id) : null, (e) => {
    if (e.type === "message" || e.type === "seen") qc.invalidateQueries({ queryKey: key, exact: true });
  });
  return query;
}

/** Qui est en train d'écrire (hors moi) — s'éteint seul après 3 s sans nouvel événement. */
export function useTypingUsers(id: number | null | undefined) {
  const { user } = useAuth();
  const [typing, setTyping] = useState<Record<number, string>>({});
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setTyping({});
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, [id]);

  const drop = (userId: number) => setTyping((s) => Object.fromEntries(Object.entries(s).filter(([k]) => Number(k) !== userId)));

  useRealtime<ConversationEvent>(id ? channels.conversation(id) : null, (e) => {
    if (e.type === "message") {
      // un message reçu éteint les indicateurs
      setTyping({});
      return;
    }
    if (e.type !== "typing" || e.userId === user?.id) return;
    clearTimeout(timers.current[e.userId]);
    if (!e.typing) return drop(e.userId);
    setTyping((s) => ({ ...s, [e.userId]: e.name }));
    timers.current[e.userId] = setTimeout(() => drop(e.userId), 3000);
  });
  return Object.values(typing);
}

/** Envoie les signaux « j'écris… » (throttle 1,5 s) et « j'ai arrêté » (2,5 s d'inactivité). */
export function useTypingSignal(id: number) {
  const { user } = useAuth();
  const last = useRef(0);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const uid = user?.id;
  const uname = user ? user.firstName || user.username : "";

  const stop = useCallback(() => {
    clearTimeout(idle.current);
    if (uid != null && last.current) conversationsService.typing(id, false, { id: uid, name: uname });
    last.current = 0;
  }, [id, uid, uname]);

  const ping = useCallback(() => {
    if (uid == null) return;
    const now = Date.now();
    if (now - last.current > 1500) {
      conversationsService.typing(id, true, { id: uid, name: uname });
      last.current = now;
    }
    clearTimeout(idle.current);
    idle.current = setTimeout(stop, 2500);
  }, [id, uid, uname, stop]);

  useEffect(() => () => clearTimeout(idle.current), []);
  return { ping, stop };
}

/** Marque la conversation comme lue dès qu'elle est visible et que de nouveaux messages arrivent. */
export function useMarkSeen(id: number | null | undefined, messages: Message[] | undefined, myId: number) {
  const qc = useQueryClient();
  const lastMarked = useRef(0);
  useEffect(() => {
    lastMarked.current = 0;
  }, [id]);
  useEffect(() => {
    if (!id || !messages?.length) return;
    const lastIncoming = [...messages].reverse().find((m) => m.id > 0 && m.sender.id !== myId);
    if (!lastIncoming || lastIncoming.id <= lastMarked.current) return;
    const run = () => {
      if (document.visibilityState !== "visible") return;
      lastMarked.current = lastIncoming.id;
      conversationsService
        .markSeen(id)
        .then(() => qc.invalidateQueries({ queryKey: messagingKeys.conversations, exact: true }))
        .catch(() => {});
    };
    run();
    document.addEventListener("visibilitychange", run);
    return () => document.removeEventListener("visibilitychange", run);
  }, [id, messages, myId, qc]);
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
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev);
    },
    onSuccess: (msg, _v, ctx) => {
      qc.setQueryData<Message[]>(key, (cur = []) => cur.map((m) => (m.id === ctx?.tempId ? msg : m)));
      qc.invalidateQueries({ queryKey: messagingKeys.conversations, exact: true });
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: conversationsService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: messagingKeys.conversations, exact: true }),
  });
}

/** Revendeur+ : proposer un prix final. */
export function usePriceProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PriceProposalInput) => conversationsService.proposePrice(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagingKeys.messages(id), exact: true }),
  });
}

/** Client : accepter / refuser une proposition — met à jour la commande partout (liste, détail, totaux). */
export function useRespondProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, accept }: { messageId: number; accept: boolean }) => conversationsService.respondProposal(id, messageId, accept),
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** Total des messages non lus (badges header / sidebar). */
export function useUnreadMessagesCount() {
  const { data } = useConversations();
  return data?.reduce((n, c) => n + c.unreadCount, 0) ?? 0;
}
