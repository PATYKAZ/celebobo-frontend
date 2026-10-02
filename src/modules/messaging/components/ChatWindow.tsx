"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft2, CloseCircle, Gallery, Money3, Receipt2, Send2 } from "iconsax-reactjs";
import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { StatusDot } from "@/shared/ui/Badges";
import { Modal } from "@/shared/ui/Overlay";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { can } from "@/modules/auth/permissions";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/modules/orders/types";
import { useConversation, useMarkSeen, useMessages, useSendMessage, useTypingSignal, useTypingUsers } from "../hooks/useConversations";
import type { Availability, Message } from "../types";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { PriceProposalModal } from "./PriceProposalModal";

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yest.toDateString()) return "Hier";
  return formatDate(iso);
};

export const PRESENCE_LABEL: Record<Availability, string> = { online: "En ligne", away: "Absent", offline: "Hors ligne" };
export const PRESENCE_DOT: Record<Availability, string> = { online: "bg-primary", away: "bg-star", offline: "bg-ink-3" };

interface Props {
  conversationId: number;
  onBack?: () => void;
  className?: string;
  /** Intégré au back-office (pas de fil d'Ariane, liens vers l'admin) */
  embedded?: boolean;
}

export function ChatWindow({ conversationId, onBack, className }: Props) {
  const { user, isStaff } = useAuth();
  const { data: conv, error: convError } = useConversation(conversationId);
  const { data: messages, isLoading } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const typingNames = useTypingUsers(conversationId);
  const typing = useTypingSignal(conversationId);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [proposal, setProposal] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const lastCount = useRef(0);

  const myId = user?.id ?? 0;
  const concluded = !!conv?.concluded;
  const isBuyer = conv?.client?.id === myId;
  const canPropose = !!conv?.relatedOrderId && !concluded && !isBuyer && can(user, "price.adjust");

  useMarkSeen(conversationId, messages, myId);

  // Aperçu de l'image à envoyer
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Auto-scroll à l'arrivée d'un message / de l'indicateur « écrit… »
  useEffect(() => {
    const el = scroller.current;
    if (!el || !messages) return;
    const grew = messages.length > lastCount.current;
    lastCount.current = messages.length;
    if (grew || typingNames.length) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typingNames.length]);

  // Reset au changement de conversation
  useEffect(() => {
    lastCount.current = 0;
    setText("");
    setFile(null);
  }, [conversationId]);

  const others = useMemo(() => conv?.participants.filter((p) => p.id !== myId && p.role !== "system") ?? [], [conv, myId]);
  // interlocuteur principal : côté staff = le client ; côté client = le revendeur assigné (sinon l'équipe)
  const lead = isStaff && !isBuyer ? others.find((p) => p.role === "client") ?? others[0] : others.find((p) => p.role === "revendeur") ?? others[0];
  const leadPresence: Availability | undefined = lead?.role === "client" ? undefined : lead?.availability ?? "online";
  const canSend = (text.trim().length > 0 || !!file) && !concluded && !send.isPending;

  const submit = () => {
    if (!canSend) return;
    typing.stop();
    send.mutate({ content: text, image: file }, { onError: () => toast.error("Message non envoyé", "Vérifiez votre connexion.") });
    setText("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  if (convError) {
    return (
      <section className={cn("grid min-h-0 place-items-center p-8 text-center", className)}>
        <div>
          <h2 className="text-[18px]">Discussion inaccessible</h2>
          <p className="mt-1 max-w-[320px] text-[14px] text-ink-2">Cette discussion n'existe pas ou ne fait pas partie de vos conversations.</p>
          {onBack && <button onClick={onBack} className="mt-4 rounded-box bg-chip px-4 py-2 text-[13px] font-bold hover:bg-primary hover:text-white">Retour</button>}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("flex min-h-0 flex-col", className)} aria-label="Conversation">
      {/* En-tête */}
      <header className="flex items-center gap-3 border-b border-line-3 px-4 py-3 sm:px-5">
        {onBack && (
          <button onClick={onBack} aria-label="Retour aux conversations" className="grid size-9 place-items-center rounded-full bg-chip lg:hidden">
            <ArrowLeft2 size={18} />
          </button>
        )}
        {conv ? (
          <>
            <div className="relative">
              <Avatar src={lead?.avatar} name={lead?.name ?? "Celebobo"} size={42} />
              {leadPresence && !concluded && <span className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white", PRESENCE_DOT[leadPresence])} aria-label={PRESENCE_LABEL[leadPresence]} />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-bold leading-[20px]">{lead?.name ?? "Équipe Celebobo"}</h2>
              <p className="flex items-center gap-1.5 truncate text-[12px] text-ink-3">
                {concluded ? "Discussion clôturée" : typingNames.length ? <span className="font-semibold text-primary">écrit…</span> : leadPresence ? PRESENCE_LABEL[leadPresence] : conv.displayName}
                {!concluded && leadPresence && <span className="hidden sm:inline">· {conv.displayName}</span>}
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {conv.orderStatus && <StatusDot tone={ORDER_STATUS_TONE[conv.orderStatus]}>{ORDER_STATUS_LABEL[conv.orderStatus]}</StatusDot>}
              {isStaff && conv.assignedRevendeur && (
                <span className="rounded-full bg-chip px-2.5 py-1 text-[12px] font-semibold">{conv.assignedRevendeur.name}</span>
              )}
              {conv.relatedOrderId &&
                (isStaff ? (
                  <Link href={ROUTES.admin.order(conv.relatedOrderId)} className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-[12px] font-bold text-primary transition-colors hover:bg-primary hover:text-white">
                    <Receipt2 size={14} variant="Bold" /> Commande #{conv.relatedOrderId}
                  </Link>
                ) : (
                  <Link href={ROUTES.orderDetail(conv.relatedOrderId)} className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-[12px] font-bold text-primary transition-colors hover:bg-primary hover:text-white">
                    <Receipt2 size={14} variant="Bold" /> Commande #{conv.relatedOrderId}
                  </Link>
                ))}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        )}
      </header>

      {/* Messages */}
      <div ref={scroller} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[linear-gradient(180deg,#fff,rgba(226,228,235,.35))] px-3 py-5 sm:px-6">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-12 w-3/5" />
          </div>
        )}
        {messages?.map((m: Message, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || new Date(prev.timestamp).toDateString() !== new Date(m.timestamp).toDateString();
          const showSender = !prev || newDay || prev.sender.id !== m.sender.id;
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className="flex justify-center py-2">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3 ring-1 ring-line-3">{dayLabel(m.timestamp)}</span>
                </div>
              )}
              <MessageBubble message={m} mine={m.sender.id === myId} showSender={showSender} onOpenImage={setLightbox} conversationId={conversationId} isBuyer={isBuyer} />
            </Fragment>
          );
        })}
        <AnimatePresence>{typingNames.length > 0 && <TypingIndicator key="typing" names={typingNames} />}</AnimatePresence>
      </div>

      {/* Composer */}
      <footer className="border-t border-line-3 p-3 sm:p-4">
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="relative mb-3 inline-block">
                <Image src={preview} alt="Aperçu" width={96} height={96} unoptimized className="size-24 rounded-box object-cover" />
                <button onClick={() => setFile(null)} aria-label="Retirer l'image" className="absolute -right-2 -top-2 rounded-full bg-white text-danger">
                  <CloseCircle size={22} variant="Bold" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {concluded ? (
          <p className="rounded-box bg-chip px-4 py-3 text-center text-[13px] text-ink-2">Cette discussion est clôturée. {isStaff ? "" : "Ouvrez une nouvelle discussion pour toute autre demande."}</p>
        ) : (
          <div className="flex items-end gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.size > 5 * 1024 * 1024) return toast.error("Image trop lourde", "5 Mo maximum.");
                setFile(f ?? null);
              }}
            />
            <button type="button" onClick={() => fileInput.current?.click()} aria-label="Joindre une image" className="grid size-[45px] shrink-0 place-items-center rounded-box bg-chip transition-colors hover:bg-primary hover:text-white">
              <Gallery size={20} />
            </button>
            {canPropose && (
              <button type="button" onClick={() => setProposal(true)} aria-label="Proposer un prix final" title="Proposer un prix final" className="hidden h-[45px] shrink-0 items-center gap-1.5 rounded-box bg-primary-50 px-3 text-[12px] font-bold uppercase text-primary transition-colors hover:bg-primary hover:text-white sm:inline-flex">
                <Money3 size={18} variant="Bold" /> Proposer un prix
              </button>
            )}
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (e.target.value) typing.ping();
                else typing.stop();
              }}
              onBlur={typing.stop}
              onKeyDown={onKey}
              rows={1}
              placeholder="Écrivez votre message…"
              aria-label="Message"
              className="field h-[45px] max-h-32 min-h-[45px] resize-none py-[11px]"
            />
            <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={submit} disabled={!canSend} aria-label="Envoyer" className="grid size-[45px] shrink-0 place-items-center rounded-box bg-primary text-white transition-colors hover:bg-primary-dark disabled:bg-line disabled:text-white">
              <Send2 size={20} variant="Bold" />
            </motion.button>
          </div>
        )}
        {canPropose && !concluded && (
          <button type="button" onClick={() => setProposal(true)} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-primary sm:hidden">
            <Money3 size={15} variant="Bold" /> Proposer un prix final
          </button>
        )}
      </footer>

      {conv?.relatedOrderId && <PriceProposalModal open={proposal} onClose={() => setProposal(false)} conversationId={conversationId} orderId={conv.relatedOrderId} />}

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title="Image" className="max-w-[760px]">
        {lightbox && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lightbox} alt="Pièce jointe agrandie" className="max-h-[70vh] w-full rounded-box object-contain" />
        )}
      </Modal>
    </section>
  );
}
