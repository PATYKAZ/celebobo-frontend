"use client";

import { useState } from "react";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Textarea } from "@/shared/ui/Form";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { toast } from "@/shared/ui/Toast";
import { useShippingQuote } from "../hooks/useConversations";
import type { Conversation, ConversationOrder } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
  order: ConversationOrder;
}

/** Revendeur+ : frais et délai de livraison d'une commande en zone sur devis (politique de livraison). */
export function ShippingQuoteModal({ open, onClose, conversation, order }: Props) {
  const quote = useShippingQuote(conversation.id);
  const [fee, setFee] = useState("");
  const [estimate, setEstimate] = useState(order.deliveryEstimate ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const submit = () => {
    const n = Number(fee);
    if (fee.trim() === "" || !Number.isFinite(n) || n < 0) return setError("Saisissez un montant valide (0 si la livraison est offerte).");
    setError(undefined);
    quote.mutate(
      { fee: n, deliveryEstimate: estimate, reason },
      {
        onSuccess: () => {
          toast.success("Frais envoyés", "Le client doit les accepter avant que vous puissiez confirmer la commande.");
          setFee("");
          setReason("");
          onClose();
        },
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Proposer les frais de livraison">
      <div className="space-y-4 pb-2 pt-1">
        <p className="text-[13px] leading-[19px] text-ink-2">
          Commande {order.number} : zone sur devis. Le client reçoit une carte avec Accepter / Refuser ; il ne paie rien avant d&apos;avoir accepté, et le montant ne peut plus changer ensuite.
        </p>
        <Input label="Frais de livraison ($)" type="number" inputMode="decimal" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} error={error} autoFocus />
        <Input label="Délai de livraison" value={estimate} onChange={(e) => setEstimate(e.target.value)} placeholder="Ex. : 3 à 5 jours" maxLength={60} />
        <Textarea label="Note (optionnel)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : envoi par bus depuis Bukavu" className="min-h-[80px]" maxLength={500} />
        <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
          <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button upper={false} loading={quote.isPending} onClick={submit}>Envoyer les frais</Button>
        </div>
      </div>
    </BottomSheet>
  );
}
