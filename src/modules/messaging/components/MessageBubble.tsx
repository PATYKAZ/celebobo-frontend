"use client";

import { motion } from "motion/react";
import { InfoCircle, TickCircle } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatTime } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { isPriceProposal, isSystemMessage, type Message, type PriceProposalMeta } from "../types";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { PriceProposalCard } from "./PriceProposalCard";

interface Props {
  message: Message;
  mine: boolean;
  /** Affiche l'avatar + nom (premier message d'une série). */
  showSender: boolean;
  onOpenImage: (src: string) => void;
  conversationId: number;
  /** Le lecteur est le client de la commande (peut accepter / refuser une proposition de prix) */
  isBuyer: boolean;
}

export function MessageBubble({ message, mine, showSender, onOpenImage, conversationId, isBuyer }: Props) {
  const fromCart = !!(message.metadata && (message.metadata as Record<string, unknown>).generatedFromCart);
  const pending = message.id < 0;

  if (isSystemMessage(message)) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center py-1">
        <span className="inline-flex max-w-[90%] items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1.5 text-center text-[12px] font-semibold leading-[17px] text-primary-dark">
          <InfoCircle size={14} variant="Bold" className="shrink-0" /> {message.content}
        </span>
      </motion.div>
    );
  }

  const proposal = isPriceProposal(message) ? (message.metadata as unknown as PriceProposalMeta) : null;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}
    >
      {!mine && <div className="w-8 shrink-0">{showSender && <Avatar src={message.sender.avatar} name={message.sender.name} size={32} />}</div>}
      <div className={cn("flex max-w-[86%] flex-col sm:max-w-[72%]", mine ? "items-end" : "items-start")}>
        {!mine && showSender && (
          <span className="mb-1 ml-1 text-[12px] font-semibold text-ink-2">
            {message.sender.name}
            {message.sender.role !== "client" && <span className="ml-1.5 rounded bg-primary-100 px-1.5 py-px text-[10px] font-bold uppercase text-primary-dark">{message.sender.role === "revendeur" ? "Revendeur" : "Équipe"}</span>}
          </span>
        )}
        {proposal ? (
          <PriceProposalCard conversationId={conversationId} messageId={message.id} meta={proposal} canRespond={isBuyer && !mine} mine={mine} />
        ) : (
          <div className={cn("rounded-2xl px-4 py-2.5 text-[14px] leading-[21px]", mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-chip text-ink", pending && "opacity-70")}>
            {message.image && (
              <button type="button" onClick={() => onOpenImage(message.image as string)} className="mb-2 block overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={message.image} alt="Pièce jointe" className="max-h-[220px] w-full max-w-[260px] object-cover transition-transform duration-500 hover:scale-105" />
              </button>
            )}
            {message.content &&
              (fromCart ? <OrderSummaryCard content={message.content} orderId={(message.metadata as { orderId?: number } | null)?.orderId} mine={mine} /> : <p className="whitespace-pre-wrap break-words">{message.content}</p>)}
          </div>
        )}
        <span className="mt-1 flex items-center gap-1 px-1 text-[11px] text-ink-3">
          {formatTime(message.timestamp)}
          {mine && (
            <motion.span key={String(message.seen)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="inline-flex items-center gap-0.5" title={message.seen ? "Lu" : "Envoyé"}>
              <TickCircle size={12} variant={message.seen ? "Bold" : "Linear"} color={message.seen ? "#1ABA1A" : "#999"} />
              {message.seen && <span className="text-[10px] font-semibold text-primary">Lu</span>}
            </motion.span>
          )}
        </span>
      </div>
    </motion.div>
  );
}

/** Indicateur « X écrit… » (3 points animés). */
export function TypingIndicator({ names }: { names?: string[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="flex items-end gap-2">
      <div className="w-8" />
      <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md bg-chip px-4 py-3" aria-label={names?.length ? `${names.join(", ")} écrit` : "Votre interlocuteur écrit"}>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 animate-typing-dot rounded-full bg-ink-3" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
        {names && names.length > 0 && <span className="text-[12px] text-ink-3">{names.join(", ")} écrit…</span>}
      </div>
    </motion.div>
  );
}
