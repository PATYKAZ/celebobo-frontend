"use client";

import { useState, type FormEvent } from "react";
import { Star1 } from "@/shared/ui/icons";
import { getErrorMessage } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Form";
import { Stars } from "@/shared/ui/Stars";
import { toast } from "@/shared/ui/Toast";
import { useRateOrder } from "../hooks/useOrders";
import type { Order } from "../types";

/** Après la livraison : le client note le revendeur (1 à 5 + commentaire), une seule fois. */
export function RateResellerCard({ order }: { order: Order }) {
  const rate = useRateOrder(order.number ?? String(order.id));
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string>();
  const reseller = order.assignedRevendeur?.name ?? "votre revendeur";

  if (order.rating) {
    return (
      <Block pad="none" className="p-4 sm:p-5">
        <h2 className="text-base sm:text-section">Votre note</h2>
        <div className="mt-3 flex items-center gap-2">
          <Stars rating={order.rating.score} size={18} hideCount />
          <span className="text-sm font-semibold text-ink-2">{order.rating.score}/5 · le {formatDate(order.rating.createdAt)}</span>
        </div>
        {order.rating.comment && <p className="mt-2 text-sm text-ink-2">« {order.rating.comment} »</p>}
      </Block>
    );
  }
  if (!order.canRate) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (score < 1) return setError("Choisissez une note de 1 à 5 étoiles.");
    setError(undefined);
    rate.mutate(
      { score, comment },
      {
        onSuccess: () => toast.success("Merci pour votre note", `Elle aide ${reseller} et l'équipe Celebobo à s'améliorer.`),
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Block pad="none" className="p-4 sm:p-5">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <h2 className="text-base sm:text-section">Notez {reseller}</h2>
        <p className="text-sm text-ink-2">Comment s&apos;est passée votre commande avec votre revendeur : échanges, délai, remise ?</p>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Note du revendeur">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={score === n} aria-label={`${n} étoile${n > 1 ? "s" : ""}`} onMouseEnter={() => setHover(n)} onClick={() => setScore(n)} className="grid size-11 place-items-center transition-transform hover:scale-110">
              <Star1 size={30} variant="Bold" color={n <= (hover || score) ? "#D6955B" : "#C9CBD3"} />
            </button>
          ))}
          {score > 0 && <span className="ml-1 text-sm font-semibold text-ink-2">{score}/5</span>}
        </div>
        <Textarea label="Commentaire (optionnel)" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ex. : très réactif, livraison à l'heure" maxLength={1000} error={error} className="min-h-[84px]" />
        <Button type="submit" loading={rate.isPending} className="self-start" upper={false}>Envoyer ma note</Button>
      </form>
    </Block>
  );
}
