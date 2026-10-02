"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowLeft2, ArrowRight2, CloseCircle, Gallery, Money3, More, Profile, Receipt2, Send2, User } from "iconsax-reactjs";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { StatusDot } from "@/shared/ui/Badges";
import { BottomSheet } from "@/shared/ui/BottomSheet";
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

/** Zone de défilement : « proche du bas » = on suit les nouveaux messages. */
const NEAR_BOTTOM = 140;

interface Props {
  conversationId: number;
  onBack?: () => void;
  className?: string;
  /** Intégré au back-office (pas de fil d'Ariane, liens vers l'admin) */
  embedded?: boolean;
}

/** Ligne d'action de la feuille mobile (cible 56 px). */
function SheetRow({ icon, title, hint, onClick, href }: { icon: React.ReactNode; title: string; hint?: React.ReactNode; onClick?: () => void; href?: string }) {
  const inner = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-chip text-ink">{icon}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[15px] font-semibold leading-[20px]">{title}</span>
        {hint && <span className="block truncate text-[12px] text-ink-3">{hint}</span>}
      </span>
      {(href || onClick) && <ArrowRight2 size={16} className="shrink-0 text-ink-3" />}
    </>
  );
  const cls = "flex min-h-14 w-full items-center gap-3 rounded-box px-1 py-1.5 transition-colors active:bg-chip";
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
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
  const [details, setDetails] = useState(false);
  const [actions, setActions] = useState(false);
  const [jump, setJump] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const lastCount = useRef(0);
  const nearBottom = useRef(true);

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

  const toBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Défilement : chargement initial instantané ; nouveaux messages suivis si on est en bas (ou si c'est le nôtre),
  // sinon bouton « Nouveaux messages ».
  useEffect(() => {
    if (!messages) return;
    const grew = messages.length > lastCount.current;
    const first = lastCount.current === 0 && messages.length > 0;
    lastCount.current = messages.length;
    if (first) return toBottom("auto");
    if (!grew) return;
    const lastMine = messages[messages.length - 1]?.sender.id === myId;
    if (nearBottom.current || lastMine) toBottom("smooth");
    else setJump(true);
  }, [messages, myId, toBottom]);

  useEffect(() => {
    if (typingNames.length && nearBottom.current) toBottom("smooth");
  }, [typingNames.length, toBottom]);

  // Le clavier mobile / la zone de saisie qui grandit réduisent la zone de messages : on reste collé en bas.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (nearBottom.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
    nearBottom.current = near;
    if (near) setJump(false);
  };

  // Reset au changement de conversation
  useEffect(() => {
    lastCount.current = 0;
    nearBottom.current = true;
    setText("");
    setFile(null);
    setJump(false);
  }, [conversationId]);

  // Zone de saisie auto-extensible (jusqu'à 128 px)
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "";
    if (el.scrollHeight > el.clientHeight) el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  const others = useMemo(() => conv?.participants.filter((p) => p.id !== myId && p.role !== "system") ?? [], [conv, myId]);
  // interlocuteur principal : côté staff = le client ; côté client = le revendeur assigné (sinon l'équipe)
  const lead = isStaff && !isBuyer ? others.find((p) => p.role === "client") ?? others[0] : others.find((p) => p.role === "revendeur") ?? others[0];
  const leadPresence: Availability | undefined = lead?.role === "client" ? undefined : lead?.availability ?? "online";
  const canSend = (text.trim().length > 0 || !!file) && !concluded && !send.isPending;
  const orderHref = conv?.relatedOrderId ? (isStaff ? ROUTES.admin.order(conv.relatedOrderId) : ROUTES.orderDetail(conv.relatedOrderId)) : null;

  const submit = () => {
    if (!canSend) return;
    typing.stop();
    nearBottom.current = true;
    send.mutate({ content: text, image: file }, { onError: () => toast.error("Message non envoyé", "Vérifiez votre connexion.") });
    setText("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Sur écran tactile, « Entrée » = retour à la ligne (le bouton envoie) ; sur desktop, Entrée envoie.
    const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (e.key === "Enter" && !e.shiftKey && !touch) {
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
          {onBack && <button onClick={onBack} className="mt-4 min-h-12 rounded-box bg-chip px-6 text-[14px] font-bold active:scale-95 hover:bg-primary hover:text-white">Retour</button>}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("flex min-h-0 flex-col", className)} aria-label="Conversation">
      {/* ───── En-tête (collant) ───── */}
      <header className="relative z-10 flex shrink-0 items-center gap-1.5 border-b border-line-3 bg-white py-2 pl-1.5 pr-2 pt-[max(8px,env(safe-area-inset-top))] sm:gap-3 sm:px-5 sm:py-3 lg:pt-3">
        {onBack && (
          <button onClick={onBack} aria-label="Retour aux conversations" className="grid size-11 shrink-0 place-items-center rounded-full transition-colors active:bg-chip lg:hidden">
            <ArrowLeft2 size={22} />
          </button>
        )}
        {conv ? (
          <>
            <div className="relative shrink-0">
              <Avatar src={lead?.avatar} name={lead?.name ?? "Celebobo"} size={42} />
              {leadPresence && !concluded && <span className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white", PRESENCE_DOT[leadPresence])} aria-label={PRESENCE_LABEL[leadPresence]} />}
            </div>
            <div className="min-w-0 flex-1 pl-0.5">
              <h2 className="truncate text-[15px] font-bold leading-[20px]">{lead?.name ?? "Équipe Celebobo"}</h2>
              <p className="flex items-center gap-1.5 truncate text-[12px] text-ink-3">
                {concluded ? "Discussion clôturée" : typingNames.length ? <span className="font-semibold text-primary">écrit…</span> : leadPresence ? PRESENCE_LABEL[leadPresence] : conv.displayName}
                {!concluded && leadPresence && <span className="hidden sm:inline">· {conv.displayName}</span>}
              </p>
            </div>
            {/* ≥ sm : puces d'état ; mobile : lien commande compact + menu « détails » */}
            <div className="hidden items-center gap-2 sm:flex">
              {conv.orderStatus && <StatusDot tone={ORDER_STATUS_TONE[conv.orderStatus]}>{ORDER_STATUS_LABEL[conv.orderStatus]}</StatusDot>}
              {isStaff && conv.assignedRevendeur && <span className="rounded-full bg-chip px-2.5 py-1 text-[12px] font-semibold">{conv.assignedRevendeur.name}</span>}
              {conv.relatedOrderId && orderHref && (
                <Link href={orderHref} className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-[12px] font-bold text-primary transition-colors hover:bg-primary hover:text-white">
                  <Receipt2 size={14} variant="Bold" /> Commande #{conv.relatedOrderId}
                </Link>
              )}
            </div>
            <button onClick={() => setDetails(true)} aria-label="Détails de la discussion" className="grid size-11 shrink-0 place-items-center rounded-full transition-colors active:bg-chip sm:hidden">
              <More size={22} variant="Bold" />
            </button>
          </>
        ) : (
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        )}
      </header>

      {/* ───── Messages ───── */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="h-full space-y-2 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#fff,rgba(226,228,235,.35))] px-3 py-4 sm:px-6 sm:py-5"
        >
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

        <AnimatePresence>
          {jump && (
            <motion.button
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              onClick={() => {
                toBottom("smooth");
                setJump(false);
              }}
              className="absolute bottom-3 left-1/2 inline-flex min-h-11 -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink-dark px-4 text-[13px] font-semibold text-white shadow-[0_6px_20px_rgba(0,0,0,.25)] active:scale-95"
            >
              <ArrowDown size={16} /> Nouveaux messages
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ───── Zone de saisie (ancrée en bas) ───── */}
      <footer className="shrink-0 border-t border-line-3 bg-white px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 sm:p-4">
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="relative mb-3 inline-block">
                <Image src={preview} alt="Aperçu" width={96} height={96} unoptimized className="size-20 rounded-box object-cover sm:size-24" />
                <button onClick={() => setFile(null)} aria-label="Retirer l'image" className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-white text-danger shadow">
                  <CloseCircle size={24} variant="Bold" />
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
            {/* mobile : « + » ouvre la feuille d'actions */}
            <button type="button" onClick={() => setActions(true)} aria-label="Plus d'actions" className="grid size-12 shrink-0 place-items-center rounded-full bg-chip text-ink transition-all active:scale-90 sm:hidden">
              <span className="text-[26px] font-light leading-none">+</span>
            </button>
            {/* ≥ sm : boutons directs */}
            <button type="button" onClick={() => fileInput.current?.click()} aria-label="Joindre une image" className="hidden size-[45px] shrink-0 place-items-center rounded-box bg-chip transition-colors hover:bg-primary hover:text-white sm:grid">
              <Gallery size={20} />
            </button>
            {canPropose && (
              <button type="button" onClick={() => setProposal(true)} aria-label="Proposer un prix final" title="Proposer un prix final" className="hidden h-[45px] shrink-0 items-center gap-1.5 rounded-box bg-primary-50 px-3 text-[12px] font-bold uppercase text-primary transition-colors hover:bg-primary hover:text-white sm:inline-flex">
                <Money3 size={18} variant="Bold" /> Proposer un prix
              </button>
            )}
            <textarea
              ref={area}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (e.target.value) typing.ping();
                else typing.stop();
              }}
              onFocus={() => nearBottom.current && toBottom("auto")}
              onBlur={typing.stop}
              onKeyDown={onKey}
              rows={1}
              enterKeyHint="send"
              placeholder="Écrivez votre message…"
              aria-label="Message"
              className="field max-h-32 min-h-12 resize-none py-3 leading-6 max-sm:rounded-[24px] max-sm:px-4 sm:h-[45px] sm:min-h-[45px] sm:py-[11px] sm:leading-[21px]"
            />
            <motion.button whileTap={{ scale: 0.88 }} type="button" onClick={submit} disabled={!canSend} aria-label="Envoyer" className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark disabled:bg-line disabled:text-white sm:size-[45px] sm:rounded-box">
              <Send2 size={20} variant="Bold" />
            </motion.button>
          </div>
        )}
      </footer>

      {/* ───── Feuilles & visionneuse ───── */}
      <BottomSheet open={actions} onClose={() => setActions(false)} title="Ajouter à la discussion">
        <div className="pb-2 pt-1">
          <SheetRow
            icon={<Gallery size={22} />}
            title="Joindre une photo"
            hint="Depuis votre galerie ou l'appareil photo"
            onClick={() => {
              fileInput.current?.click();
              setActions(false);
            }}
          />
          {canPropose && (
            <SheetRow
              icon={<Money3 size={22} variant="Bold" />}
              title="Proposer un prix final"
              hint="Le client accepte ou refuse en un geste"
              onClick={() => {
                setActions(false);
                setProposal(true);
              }}
            />
          )}
        </div>
      </BottomSheet>

      <BottomSheet open={details} onClose={() => setDetails(false)} title="Détails de la discussion">
        <div className="space-y-1 pb-2 pt-1">
          {conv?.orderStatus && (
            <SheetRow icon={<Receipt2 size={22} />} title={`Commande #${conv.relatedOrderId}`} hint={<StatusDot tone={ORDER_STATUS_TONE[conv.orderStatus]}>{ORDER_STATUS_LABEL[conv.orderStatus]}</StatusDot>} href={orderHref ?? undefined} />
          )}
          {!conv?.orderStatus && conv?.relatedOrderId && orderHref && <SheetRow icon={<Receipt2 size={22} />} title={`Commande #${conv.relatedOrderId}`} href={orderHref} />}
          {lead && <SheetRow icon={<User size={22} />} title={lead.name} hint={leadPresence ? PRESENCE_LABEL[leadPresence] : lead.role === "client" ? "Client" : "Équipe Celebobo"} />}
          {isStaff && conv?.assignedRevendeur && <SheetRow icon={<Profile size={22} />} title={conv.assignedRevendeur.name} hint="Revendeur assigné" />}
          {conv && <p className="px-1 pt-2 text-[12px] text-ink-3">{conv.displayName}</p>}
        </div>
      </BottomSheet>

      {conv?.relatedOrderId && <PriceProposalModal open={proposal} onClose={() => setProposal(false)} conversationId={conversationId} orderId={conv.relatedOrderId} />}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-3"
            role="dialog"
            aria-modal="true"
            aria-label="Image agrandie"
          >
            <button onClick={() => setLightbox(null)} aria-label="Fermer" className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur active:scale-90">
              <CloseCircle size={26} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img initial={{ scale: 0.92 }} animate={{ scale: 1 }} src={lightbox} alt="Pièce jointe agrandie" className="max-h-[88dvh] max-w-full rounded-box object-contain" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
