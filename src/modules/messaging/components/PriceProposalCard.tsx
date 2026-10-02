"use client";

import { motion } from "motion/react";
import { CloseCircle, Money3, TickCircle, Timer1 } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { toast } from "@/shared/ui/Toast";
import { getErrorMessage } from "@/shared/lib/api";
import type { PriceProposalMeta } from "../types";
import { useRespondProposal } from "../hooks/useConversations";

interface Props {
  conversationId: number;
  messageId: number;
  meta: PriceProposalMeta;
  /** Le lecteur est le client concerné → boutons Accepter / Refuser */
  canRespond: boolean;
  mine: boolean;
}

const STATUS = {
  pending: { label: "En attente de réponse du client", icon: Timer1, cls: "bg-star/15 text-[#b87400]" },
  accepted: { label: "Acceptée", icon: TickCircle, cls: "bg-primary-100 text-primary-dark" },
  refused: { label: "Refusée", icon: CloseCircle, cls: "bg-danger-100 text-danger" },
} as const;

/** Carte « Proposition de prix » : ancien prix barré → nouveau prix, motif, état, actions client. */
export function PriceProposalCard({ conversationId, messageId, meta, canRespond, mine }: Props) {
  const respond = useRespondProposal(conversationId);
  const st = STATUS[meta.status];
  const Icon = st.icon;
  const diff = meta.oldPrice - meta.newPrice;

  const answer = (accept: boolean) =>
    respond.mutate(
      { messageId, accept },
      {
        onSuccess: () => (accept ? toast.success("Prix mis à jour", `${meta.productName} : ${formatPrice(meta.newPrice)}`) : toast.info("Proposition refusée")),
        onError: (e) => toast.error("Action impossible", getErrorMessage(e)),
      },
    );

  return (
    <div className={cn("w-[280px] max-w-full overflow-hidden rounded-xl text-ink", mine ? "bg-white/95" : "bg-white")}>
      <div className="flex items-center gap-2 bg-primary px-3.5 py-2 text-[12px] font-bold uppercase tracking-wide text-white">
        <Money3 size={16} variant="Bold" /> Proposition de prix
      </div>
      <div className="space-y-3 p-3.5">
        <div>
          <p className="text-[13px] font-bold leading-[18px]">{meta.productName}</p>
          <p className="text-[12px] text-ink-3">Quantité : {meta.quantity} · Commande #{meta.orderId}</p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] text-ink-3 line-through">{formatPrice(meta.oldPrice)}</p>
            <motion.p key={meta.status} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-[22px] font-bold leading-[26px] text-primary">
              {formatPrice(meta.newPrice)}
            </motion.p>
          </div>
          {diff !== 0 && (
            <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-bold", diff > 0 ? "bg-primary-100 text-primary-dark" : "bg-star/15 text-[#b87400]")}>
              {diff > 0 ? "−" : "+"}
              {formatPrice(Math.abs(diff))} / unité
            </span>
          )}
        </div>
        {meta.reason && <p className="rounded-md bg-page/60 px-3 py-2 text-[12px] leading-[18px] text-ink-2">« {meta.reason} »</p>}

        {meta.status === "pending" && canRespond ? (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => answer(true)} disabled={respond.isPending} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary text-[12px] font-bold uppercase text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
              <TickCircle size={15} variant="Bold" /> Accepter
            </button>
            <button onClick={() => answer(false)} disabled={respond.isPending} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-chip text-[12px] font-bold uppercase transition-colors hover:bg-danger hover:text-white disabled:opacity-60">
              <CloseCircle size={15} variant="Bold" /> Refuser
            </button>
          </div>
        ) : (
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold", st.cls)}>
            <Icon size={14} variant="Bold" /> {st.label}
          </span>
        )}
      </div>
    </div>
  );
}
