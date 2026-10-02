"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Select, Textarea } from "@/shared/ui/Form";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { toast } from "@/shared/ui/Toast";
import { conversationsService } from "../services/conversations.service";
import { usePriceProposal } from "../hooks/useConversations";

interface Props {
  open: boolean;
  onClose: () => void;
  conversationId: number;
  orderId: number;
}

/** Revendeur+ : choisir une ligne de la commande, saisir le nouveau prix unitaire et le motif. */
export function PriceProposalModal({ open, onClose, conversationId, orderId }: Props) {
  const { data: order } = useQuery({ queryKey: ["conversations", conversationId, "order", orderId], queryFn: () => conversationsService.order(conversationId), enabled: open });
  const propose = usePriceProposal(conversationId);
  const [itemId, setItemId] = useState("");
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const item = useMemo(() => order?.items.find((i) => String(i.id) === itemId), [order, itemId]);

  useEffect(() => {
    if (open && order && !itemId) setItemId(String(order.items[0]?.id ?? ""));
  }, [open, order, itemId]);
  useEffect(() => {
    if (item) setPrice(String(item.unitPrice));
  }, [item]);

  const submit = () => {
    const n = Number(price);
    if (!item) return setError("Choisissez un article.");
    if (!(n > 0)) return setError("Saisissez un prix valide.");
    if (n === item.unitPrice) return setError("Le nouveau prix doit être différent du prix actuel.");
    setError(undefined);
    propose.mutate(
      { itemId: item.id, newPrice: n, reason },
      {
        onSuccess: () => {
          toast.success("Proposition envoyée", "Le client doit l'accepter pour que le prix soit mis à jour.");
          setReason("");
          onClose();
        },
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Proposer un prix final">
      <div className="space-y-4 pb-2 pt-1">
        <p className="text-[13px] leading-[19px] text-ink-2">Le client recevra une carte avec Accepter / Refuser. Le prix de la commande n'est modifié qu'après son accord.</p>
        <Select
          label="Article de la commande"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          options={(order?.items ?? []).map((i) => ({ value: i.id, label: `${i.productName} — ${formatPrice(i.unitPrice)} × ${i.quantity}` }))}
        />
        <Input label="Nouveau prix unitaire ($)" type="number" inputMode="decimal" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} hint={item ? `Prix actuel : ${formatPrice(item.unitPrice)}` : undefined} error={error} />
        <Textarea label="Motif (optionnel)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : remise fidélité, produit reconditionné…" className="min-h-[80px]" />
        <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
          <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button upper={false} loading={propose.isPending} onClick={submit}>Envoyer la proposition</Button>
        </div>
      </div>
    </BottomSheet>
  );
}
