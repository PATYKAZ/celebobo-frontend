"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useRealtime, useRealtimeConnected } from "@/shared/hooks/useRealtime";
import { channels, type ConversationEvent, type UserEvent } from "@/shared/lib/realtime";
import { conversationsService } from "../services/conversations.service";
import { toMessage, type MessageDto } from "../services/messaging.mapper";
import { MESSAGING_CHANNEL, type Conversation, type Message, type MessagingEvent, type NewSupportInput, type PriceProposalInput, type SendMessageInput } from "../types";
import { useUnreadCounts } from "./useNotifications";

export const messagingKeys = {
  all: ["conversations"] as const,
  conversations: (userId?: number) => ["conversations", "list", userId] as const,
  conversation: (id: number) => ["conversations", id] as const,
  messages: (id: number) => ["conversations", id, "messages"] as const,
  order: (id: number) => ["conversations", id, "order"] as const,
};

/** Repli polling : lent quand le WebSocket est connecté, plus serré sinon. */
const poll = (live: boolean, ms: number) => (live ? false : ms);

/** Dernier message lu par l'interlocuteur, par discussion (reçu en direct ; l'API REST ne l'expose pas). */
const peerRead = new Map<number, number>();

/** Ordre chronologique : messages confirmés par id, puis messages optimistes (id < 0). */
const ordered = (list: Message[]) => [...list.filter((m) => m.id > 0).sort((a, b) => a.id - b.id), ...list.filter((m) => m.id < 0)];

function upsert(list: Message[], m: Message): Message[] {
  return ordered([...list.filter((x) => x.id !== m.id && !(m.clientMsgId && x.id < 0 && x.clientMsgId === m.clientMsgId)), m]);
}

function withSeen(list: Message[], conversationId: number, myId: number | undefined): Message[] {
  const upTo = peerRead.get(conversationId) ?? 0;
  return list.map((m) => (m.id > 0 && m.id <= upTo && m.sender.id === myId && !m.seen ? { ...m, seen: true } : m));
}

const refreshMessaging = (qc: QueryClient) => qc.invalidateQueries({ queryKey: ["conversations", "list"] });

/** Conversations visibles + mise à jour instantanée (nouveau message, lu, assignation, clôture). */
export function useConversations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const live = useRealtimeConnected();
  const query = useQuery({ queryKey: messagingKeys.conversations(user?.id), queryFn: conversationsService.list, enabled: !!user, refetchInterval: poll(live, 20000) });
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: messagingKeys.conversations(user?.id), exact: true }), [qc, user?.id]);
  useRealtime<MessagingEvent>(user ? MESSAGING_CHANNEL : null, refresh);
  useRealtime<UserEvent>(user ? channels.user(user.id) : null, (e) => e.type === "resync" && refresh());
  return query;
}

export function useConversation(id: number | null | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const query = useQuery({ queryKey: messagingKeys.conversation(id ?? 0), queryFn: () => conversationsService.detail(id as number), enabled: !!id && !!user, retry: false });
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: messagingKeys.conversation(id ?? 0), exact: true }), [qc, id]);
  useRealtime<MessagingEvent>(id && user ? MESSAGING_CHANNEL : null, (e) => {
    if (e.type === "conversation" && e.conversationId === id) refresh();
  });
  return query;
}

/** Commande liée à la discussion (statut, lignes pour la proposition de prix, présence du revendeur). */
export function useConversationOrder(conv: Conversation | undefined) {
  const qc = useQueryClient();
  const { user, isStaff } = useAuth();
  const staff = isStaff && conv?.client?.id !== user?.id;
  const ready = !!conv?.relatedOrderId && (staff || !!conv.orderNumber);
  const query = useQuery({
    queryKey: messagingKeys.order(conv?.id ?? 0),
    queryFn: () => conversationsService.order(conv as Conversation, staff),
    enabled: !!user && ready,
    staleTime: 30_000,
    retry: false,
  });
  useRealtime<UserEvent>(user && ready ? channels.user(user.id) : null, (e) => {
    if ((e.type === "order.status" || e.type === "assignment") && e.orderId === conv?.relatedOrderId) qc.invalidateQueries({ queryKey: messagingKeys.order(conv.id) });
  });
  return query;
}

/** Messages d'une conversation : insérés en direct depuis le WebSocket, polling de secours si la connexion tombe. */
export function useMessages(id: number | null | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const live = useRealtimeConnected();
  const key = messagingKeys.messages(id ?? 0);
  const myId = user?.id;
  const query = useQuery({
    queryKey: key,
    enabled: !!id && !!user,
    refetchInterval: poll(live, 6000),
    queryFn: async () => {
      const fresh = await conversationsService.messages(id as number);
      const pending = (qc.getQueryData<Message[]>(key) ?? []).filter((m) => m.id < 0 && !fresh.some((f) => f.clientMsgId && f.clientMsgId === m.clientMsgId));
      return withSeen([...fresh, ...pending], id as number, myId);
    },
  });
  useRealtime<ConversationEvent>(id && user ? channels.conversation(id) : null, (e) => {
    if (!id) return;
    if (e.type === "message" && e.message) {
      const m = toMessage(e.message as MessageDto);
      qc.setQueryData<Message[]>(key, (cur) => (cur ? withSeen(upsert(cur, m), id, myId) : cur));
      // une réponse à une proposition change l'état de la carte + la commande
      if ((m.metadata as { event?: string } | null)?.event === "proposal_answered") {
        qc.invalidateQueries({ queryKey: key, exact: true });
        qc.invalidateQueries({ queryKey: messagingKeys.order(id) });
      }
    } else if (e.type === "seen" && e.userId !== myId) {
      peerRead.set(id, Math.max(peerRead.get(id) ?? 0, e.upTo));
      qc.setQueryData<Message[]>(key, (cur) => cur && withSeen(cur, id, myId));
    } else if (e.type === "conversation" || e.type === "resync") {
      qc.invalidateQueries({ queryKey: key, exact: true });
      qc.invalidateQueries({ queryKey: messagingKeys.conversation(id), exact: true });
    }
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

  useRealtime<ConversationEvent>(id && user ? channels.conversation(id) : null, (e) => {
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
        .markSeen(id, lastIncoming.id)
        .then(() => {
          refreshMessaging(qc);
          qc.invalidateQueries({ queryKey: ["notifications"] });
        })
        .catch(() => {});
    };
    run();
    document.addEventListener("visibilitychange", run);
    return () => document.removeEventListener("visibilitychange", run);
  }, [id, messages, myId, qc]);
}

/** Envoi avec mise à jour optimiste (le message serveur, reçu par l'API ou le WebSocket, remplace le brouillon). */
export function useSendMessage(id: number) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = messagingKeys.messages(id);

  return useMutation({
    mutationFn: ({ clientMsgId, ...input }: SendMessageInput & { clientMsgId: string }) => conversationsService.send(id, { ...input, clientMsgId }),
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
        clientMsgId: input.clientMsgId,
      };
      qc.setQueryData<Message[]>(key, [...prev, temp]);
      return { tempId: temp.id };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData<Message[]>(key, (cur = []) => cur.filter((m) => m.id !== ctx?.tempId));
    },
    onSuccess: (msg, _v, ctx) => {
      qc.setQueryData<Message[]>(key, (cur = []) => withSeen(upsert(cur.filter((m) => m.id !== ctx?.tempId), msg), id, user?.id));
      refreshMessaging(qc);
    },
  });
}

/** Identifiant d'envoi unique (idempotence côté API). */
export const newClientMsgId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewSupportInput) => conversationsService.create(input),
    onSuccess: () => refreshMessaging(qc),
  });
}

/** Revendeur+ : proposer un prix final. */
export function usePriceProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PriceProposalInput) => conversationsService.proposePrice(id, input),
    onSuccess: (msg) => qc.setQueryData<Message[]>(messagingKeys.messages(id), (cur) => (cur ? upsert(cur, msg) : cur)),
  });
}

/** Client : accepter / refuser une proposition — met à jour la commande partout (liste, détail, totaux). */
export function useRespondProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, accept }: { proposalId: number; accept: boolean }) => conversationsService.respondProposal(proposalId, accept),
    onSettled: () => qc.invalidateQueries(),
  });
}

function useConversationMutation<V>(id: number, fn: (v: V) => Promise<Conversation>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (conv) => {
      qc.setQueryData(messagingKeys.conversation(id), conv);
      qc.invalidateQueries({ queryKey: messagingKeys.messages(id), exact: true });
      refreshMessaging(qc);
    },
  });
}

/** Revendeur+ : clôturer / rouvrir la discussion. */
export const useCloseConversation = (id: number) => useConversationMutation(id, () => conversationsService.close(id));
export const useReopenConversation = (id: number) => useConversationMutation(id, () => conversationsService.reopen(id));
/** Responsable : confier une discussion de support à un revendeur. */
export const useAssignConversation = (id: number) => useConversationMutation(id, (resellerId: number) => conversationsService.assign(id, resellerId));

/** Discussions comportant des messages non lus (badges header / sidebar). */
export function useUnreadMessagesCount() {
  return useUnreadCounts().data?.conversations ?? 0;
}
