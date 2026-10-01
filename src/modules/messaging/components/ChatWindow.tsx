"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft2, CloseCircle, Gallery, Receipt2, Send2 } from "iconsax-reactjs";
import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Modal } from "@/shared/ui/Overlay";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useConversation, useMessages, useSendMessage } from "../hooks/useConversations";
import type { Message } from "../types";
import { MessageBubble, TypingIndicator } from "./MessageBubble";

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yest.toDateString()) return "Hier";
  return formatDate(iso);
};

interface Props {
  conversationId: number;
  onBack?: () => void;
  className?: string;
}

export function ChatWindow({ conversationId, onBack, className }: Props) {
  const { user } = useAuth();
  const { data: conv } = useConversation(conversationId);
  const { data: messages, isLoading } = useMessages(conversationId);
  const send = useSendMessage(conversationId);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const lastCount = useRef(0);

  const myId = user?.id ?? 0;
  const concluded = !!conv?.concluded;

  // Aperçu de l'image à envoyer
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Auto-scroll + fin de l'indicateur « écrit… » à l'arrivée d'un message reçu
  useEffect(() => {
    const el = scroller.current;
    if (!el || !messages) return;
    const grew = messages.length > lastCount.current;
    lastCount.current = messages.length;
    if (grew) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      const last = messages[messages.length - 1];
      if (last && last.sender.id !== myId) setAwaiting(false);
    }
  }, [messages, myId]);

  useEffect(() => {
    if (!awaiting) return;
    const t = setTimeout(() => setAwaiting(false), 9000);
    return () => clearTimeout(t);
  }, [awaiting]);

  // Reset au changement de conversation
  useEffect(() => {
    lastCount.current = 0;
    setAwaiting(false);
    setText("");
    setFile(null);
  }, [conversationId]);

  const others = useMemo(() => conv?.participants.filter((p) => p.id !== myId) ?? [], [conv, myId]);
  const canSend = (text.trim().length > 0 || !!file) && !concluded && !send.isPending;

  const submit = () => {
    if (!canSend) return;
    send.mutate({ content: text, image: file }, { onError: () => toast.error("Message non envoyé", "Vérifiez votre connexion.") });
    setText("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    if (user?.role === "client") setAwaiting(true);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

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
            <div className="flex -space-x-2">
              {others.slice(0, 3).map((p) => (
                <Avatar key={p.id} src={p.avatar} name={p.name} size={40} className="ring-2 ring-white" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-bold leading-[20px]">{others.map((p) => p.name).join(", ") || "Équipe Celebobo"}</h2>
              <p className="flex items-center gap-1.5 truncate text-[12px] text-ink-3">
                <span className={cn("size-1.5 rounded-full", concluded ? "bg-ink-3" : "bg-primary")} />
                {concluded ? "Discussion clôturée" : "En ligne"} · {conv.displayName}
              </p>
            </div>
            {conv.relatedOrderId && (
              <span className="hidden items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-[12px] font-bold text-primary sm:inline-flex">
                <Receipt2 size={14} variant="Bold" /> Commande #{conv.relatedOrderId}
              </span>
            )}
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
              <MessageBubble message={m} mine={m.sender.id === myId} showSender={showSender} onOpenImage={setLightbox} />
            </Fragment>
          );
        })}
        <AnimatePresence>{awaiting && <TypingIndicator />}</AnimatePresence>
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
          <p className="rounded-box bg-chip px-4 py-3 text-center text-[13px] text-ink-2">Cette discussion est clôturée. Ouvrez une nouvelle discussion pour toute autre demande.</p>
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
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
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
      </footer>

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title="Image" className="max-w-[760px]">
        {lightbox && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lightbox} alt="Pièce jointe agrandie" className="max-h-[70vh] w-full rounded-box object-contain" />
        )}
      </Modal>
    </section>
  );
}
