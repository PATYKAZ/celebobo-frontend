"use client";

import { motion } from "motion/react";
import { CloseCircle, TickCircle, Timer1, TruckFast } from "@/shared/ui/icons";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { toast } from "@/shared/ui/Toast";
import { getErrorMessage } from "@/shared/lib/api";
import type { ShippingQuoteMeta } from "../types";
import { useRespondProposal } from "../hooks/useConversations";

interface Props {
  meta: ShippingQuoteMeta;
  /** Le lecteur est le client de la commande → boutons Accepter / Refuser */
  canRespond: boolean;
}

const STATUS = {
  pending: { label: "En attente de l'accord du client", icon: Timer1, cls: "bg-star/15 text-warn" },
  accepted: { label: "Acceptés — montant définitif", icon: TickCircle, cls: "bg-primary-100 text-primary-dark" },
  refused: { label: "Refusés", icon: CloseCircle, cls: "bg-danger-100 text-danger" },
  superseded: { label: "Remplacés par une nouvelle proposition", icon: Timer1, cls: "bg-chip text-ink-3" },
} as const;

/** Carte « Frais de livraison » (zone sur devis) : montant, délai, note, état ; le client accepte ou refuse. */
export function ShippingQuoteCard({ meta, canRespond }: Props) {
  const respond = useRespondProposal();
  const st = STATUS[meta.status];
  const Icon = st.icon;

  const answer = (accept: boolean) =>
    respond.mutate(
      { proposalId: meta.proposalId, accept },
      {
        onSuccess: () =>
          accept
            ? toast.success("Frais de livraison acceptés", `${formatPrice(meta.fee)} ajoutés à votre commande`)
            : toast.info("Frais refusés", "Le revendeur peut vous faire une autre proposition. Vous pouvez aussi annuler la commande sans frais."),
        onError: (e) => toast.error("Action impossible", getErrorMessage(e)),
      },
    );

  return (
    <div className="w-[280px] max-w-full overflow-hidden rounded-xl bg-surface text-ink shadow-[0_1px_0_rgba(0,0,0,.04)] ring-1 ring-line-3">
      <div className="flex items-center gap-2 bg-primary px-3.5 py-2 text-[12px] font-bold uppercase tracking-wide text-white">
        <TruckFast size={16} variant="Bold" /> Frais de livraison
      </div>
      <div className="space-y-3 p-3.5">
        <div>
          <p className="text-[12px] text-ink-3">
            Commande {meta.orderNumber}
            {meta.city && <> · vers {meta.city}</>}
          </p>
          <motion.p key={meta.status} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-[22px] font-bold leading-[26px] text-primary">
            {formatPrice(meta.fee)}
          </motion.p>
          {meta.deliveryEstimate && <p className="text-[13px] text-ink-2">Délai : {meta.deliveryEstimate}</p>}
        </div>
        {meta.reason && <p className="rounded-md bg-page/60 px-3 py-2 text-[12px] leading-[18px] text-ink-2">« {meta.reason} »</p>}

        {meta.status === "pending" && canRespond ? (
          <>
            <p className="text-[12px] leading-[17px] text-ink-2">Une fois accepté, ce montant s&apos;ajoute à votre commande et ne peut plus changer.</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => answer(true)} disabled={respond.isPending} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-box bg-primary text-[13px] font-bold uppercase text-white transition-all hover:bg-primary-dark active:scale-95 disabled:opacity-60 sm:h-10">
                <TickCircle size={15} variant="Bold" /> Accepter
              </button>
              <button onClick={() => answer(false)} disabled={respond.isPending} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-box bg-chip text-[13px] font-bold uppercase transition-all hover:bg-danger hover:text-white active:scale-95 disabled:opacity-60 sm:h-10">
                <CloseCircle size={15} variant="Bold" /> Refuser
              </button>
            </div>
          </>
        ) : (
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold", st.cls)}>
            <Icon size={14} variant="Bold" /> {st.label}
          </span>
        )}
      </div>
    </div>
  );
}
