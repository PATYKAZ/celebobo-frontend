"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Maximize4, MagicStar, Refresh2, Send2 } from "iconsax-reactjs";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { useAssistant } from "../hooks/useAssistant";
import { SUGGESTIONS } from "../types";
import { BotAvatar, ProductSuggestion } from "./AssistantView";
import { StreamedText } from "./StreamedText";

interface Props {
  /** Affiche l'en-tête vert (desktop) ; sur mobile le titre est dans la feuille. */
  showHeader?: boolean;
  onClose?: () => void;
  /** Appelé quand on suit un lien (produit, plein écran) pour fermer la bulle. */
  onNavigate?: () => void;
  className?: string;
}

/** Chat compact de l'assistant (bulle flottante) : mêmes données que la page /assistant (historique partagé). */
export function AssistantPanel({ showHeader, onClose, onNavigate, className }: Props) {
  const { messages, loading, send, reset } = useAssistant();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const scroll = useCallback(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), []);
  useEffect(() => {
    scroll();
  }, [messages.length, loading, scroll]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || loading) return;
    send(text);
    setText("");
  };
  const onlyWelcome = messages.length <= 1;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      {showHeader && (
        <header className="flex items-center gap-3 bg-primary px-4 py-3.5 text-white">
          <span className="relative grid size-10 place-items-center rounded-full bg-white/20">
            <MagicStar size={20} variant="Bold" />
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/30" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-[20px]">Assistant Celebobo</p>
            <p className="truncate text-[12px] text-white/80">En ligne · répond en quelques secondes</p>
          </div>
          <Link href={ROUTES.assistant} onClick={onNavigate} aria-label="Ouvrir en plein écran" title="Plein écran" className="grid size-9 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/30">
            <Maximize4 size={17} />
          </Link>
          <button onClick={reset} aria-label="Nouvelle conversation" title="Nouvelle conversation" className="grid size-9 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/30">
            <Refresh2 size={17} />
          </button>
          {onClose && (
            <button onClick={onClose} aria-label="Fermer" className="grid size-9 place-items-center rounded-full bg-white/15 text-[20px] leading-none transition-colors hover:bg-white/30">
              ×
            </button>
          )}
        </header>
      )}

      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#fff,rgba(226,228,235,.35))] px-3.5 py-4">
        {messages.map((m) => {
          const mine = m.role === "user";
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-start gap-2.5", mine && "justify-end")}>
              {!mine && <BotAvatar />}
              <div className={cn("flex min-w-0 max-w-[86%] flex-col gap-2.5", mine && "items-end")}>
                <div className={cn("rounded-2xl px-3.5 py-2.5 text-[14px] leading-[21px]", mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-chip")}>
                  {mine ? m.content : <StreamedText text={m.content} animate={m.animate} onTick={scroll} />}
                </div>
                {m.products && m.products.length > 0 && (
                  <div className="no-scrollbar -mx-1 flex max-w-full snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1 [&>*]:snap-start" onClick={onNavigate}>
                    {m.products.map((p, i) => <ProductSuggestion key={p.id} product={p} index={i} />)}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5">
              <BotAvatar />
              <div className="flex gap-1 rounded-2xl rounded-bl-md bg-chip px-4 py-3.5" aria-label="L'assistant écrit">
                {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-typing-dot rounded-full bg-ink-3" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={end} />
      </div>

      {onlyWelcome && !loading && (
        <div className="snap-row no-scrollbar border-t border-line-3 bg-white px-3 py-2.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="min-h-10 whitespace-nowrap rounded-full border border-primary/40 bg-white px-4 text-[13px] font-semibold text-primary transition-colors active:bg-primary active:text-white">
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-line-3 bg-white p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Posez votre question…" aria-label="Votre message" enterKeyHint="send" autoComplete="off" className="field flex-1" />
        <motion.button whileTap={{ scale: 0.92 }} disabled={!text.trim() || loading} aria-label="Envoyer" className="grid size-12 shrink-0 place-items-center rounded-box bg-primary text-white transition-colors hover:bg-primary-dark disabled:bg-line sm:size-[45px]">
          <Send2 size={20} variant="Bold" />
        </motion.button>
      </form>
    </div>
  );
}
