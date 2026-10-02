"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { formatPrice } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Input, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { usePayCommission } from "../hooks/useCommissions";
import type { CommissionRow } from "../types";

/** Enregistrement d'un paiement de commission (admin). Montant ≤ commission due. */
export function PayCommissionModal({ row, onClose }: { row: CommissionRow | null; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const pay = usePayCommission();

  useEffect(() => {
    if (row) {
      setAmount(row.due.toFixed(2));
      setNote("");
      setError(undefined);
    }
  }, [row]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!row) return;
    const v = Number(amount.replace(",", "."));
    if (Number.isNaN(v) || v <= 0) return setError("Saisissez un montant positif.");
    if (v > row.due + 0.005) return setError(`Maximum : ${formatPrice(row.due)} (commission due).`);
    setError(undefined);
    pay.mutate(
      { resellerId: row.resellerId, amount: v, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Paiement enregistré", `${formatPrice(v)} → ${row.name}`);
          onClose();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 400) {
            const a = err.fieldErrors.amount;
            if (a) setError(Array.isArray(a) ? a[0] : a);
          }
          toast.error("Paiement impossible", getErrorMessage(err));
        },
      },
    );
  };

  return (
    <Modal open={!!row} onClose={onClose} title="Enregistrer un paiement">
      {row && (
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid grid-cols-3 gap-3 rounded-box bg-chip p-3 text-center">
            <div><p className="text-[11px] uppercase text-ink-3">Gagné</p><p className="font-bold">{formatPrice(row.earned)}</p></div>
            <div><p className="text-[11px] uppercase text-ink-3">Déjà payé</p><p className="font-bold">{formatPrice(row.paid)}</p></div>
            <div><p className="text-[11px] uppercase text-ink-3">Dû</p><p className="font-bold text-primary">{formatPrice(row.due)}</p></div>
          </div>
          <p className="text-[14px] text-ink-2">Revendeur : <strong className="text-ink">{row.name}</strong> · taux {(row.rate * 100).toFixed(1)} %</p>
          <Input label="Montant ($)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={error} required />
          <Textarea label="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. Paiement Orange Money du mois" className="min-h-[80px]" />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="chip" onClick={onClose} upper={false}>Annuler</Button>
            <Button type="submit" loading={pay.isPending} upper={false}>Confirmer le paiement</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
