"use client";

import { useState, type FormEvent } from "react";
import { getErrorMessage } from "@/shared/lib/api";
import { formatPrice } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { usePayStatement } from "../hooks/useCommissions";
import type { PayoutStatement } from "../types";
import { payoutDay } from "./StatementsList";

/** Marque un relevé préparé comme payé (admin) : le paiement est le total du relevé, jamais plus que le dû. */
export function PayStatementModal({ statement, onClose }: { statement: PayoutStatement | null; onClose: () => void }) {
  const [note, setNote] = useState("");
  const pay = usePayStatement();

  const close = () => {
    setNote("");
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!statement) return;
    pay.mutate(
      { statementId: statement.id, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Paiement enregistré", `${formatPrice(statement.total)} → ${statement.resellerName}`);
          close();
        },
        onError: (err) => toast.error("Paiement impossible", getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal open={!!statement} onClose={close} title="Marquer le relevé comme payé">
      {statement && (
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid grid-cols-3 gap-3 rounded-box bg-chip p-3 text-center">
            <div><p className="text-xs text-ink-3">Commissions</p><p className="font-bold">{formatPrice(statement.commissions)}</p></div>
            <div><p className="text-xs text-ink-3">Livraisons</p><p className="font-bold">{formatPrice(statement.deliveryFees)}</p></div>
            <div><p className="text-xs text-ink-3">À verser</p><p className="font-bold text-primary">{formatPrice(statement.total)}</p></div>
          </div>
          <p className="text-sm text-ink-2">
            Revendeur : <strong className="text-ink">{statement.resellerName}</strong> · relevé du {payoutDay(statement.payoutDate)}
          </p>
          <Textarea label="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. M-Pesa, référence de la transaction" className="min-h-[80px]" />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={close} upper={false}>Annuler</Button>
            <Button type="submit" loading={pay.isPending} upper={false}>Confirmer le paiement</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
