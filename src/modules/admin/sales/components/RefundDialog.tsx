"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { useRefundSale } from "../hooks/useSales";
import type { RefundInput, Sale } from "../types";
import { fieldErrorsOf } from "../utils";

const TYPES: { value: RefundInput["type"]; label: string; hint: string }[] = [
  { value: "remboursement", label: "Remboursement", hint: "Le client est remboursé, le produit reste chez lui." },
  { value: "retour", label: "Retour produit", hint: "Le produit revient en stock et le client est remboursé." },
];

function RefundForm({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const refund = useRefundSale();
  const [type, setType] = useState<RefundInput["type"]>("remboursement");
  const [amount, setAmount] = useState(String(sale.total));
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    const err: Record<string, string> = {};
    if (!(n > 0) || n > sale.total) err.amount = `Entre ${formatPrice(0.01)} et ${formatPrice(sale.total)}.`;
    if (!reason.trim()) err.reason = "Indiquez le motif.";
    setErrors(err);
    if (Object.keys(err).length) return;
    refund.mutate(
      { id: sale.id, input: { type, amount: n, reason } },
      {
        onSuccess: () => {
          toast.success(type === "retour" ? "Retour enregistré" : "Remboursement enregistré", `${sale.productName} · ${formatPrice(n)}`);
          onClose();
        },
        onError: (er) => {
          setErrors(fieldErrorsOf(er));
          toast.error("Opération impossible", getErrorMessage(er));
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-box bg-page/60 p-3 text-[13px]">
        <strong>{sale.productName}</strong> × {sale.quantity} — {formatPrice(sale.total)}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {TYPES.map((t) => (
          <button key={t.value} type="button" aria-pressed={type === t.value} onClick={() => setType(t.value)} className={cn("rounded-box border p-3 text-left transition-colors", type === t.value ? "border-primary bg-primary-50" : "border-line hover:border-primary")}>
            <span className="block text-[14px] font-bold">{t.label}</span>
            <span className="text-[12px] text-ink-2">{t.hint}</span>
          </button>
        ))}
      </div>
      <Input label="Montant remboursé ($)" required type="number" min={0.01} max={sale.total} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} hint="Un remboursement partiel est possible." />
      <Textarea label="Motif" required value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason} placeholder="Produit défectueux, erreur de commande…" />
      <p className="text-[12px] text-ink-3">La vente sera retirée du chiffre d&apos;affaires et du bénéfice. L&apos;action est tracée dans le journal d&apos;audit.</p>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="chip" upper={false} onClick={onClose}>Annuler</Button>
        <Button type="submit" variant="danger" upper={false} loading={refund.isPending}>Confirmer</Button>
      </div>
    </form>
  );
}

export function RefundDialog({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  return (
    <Modal open={!!sale} onClose={onClose} title="Rembourser ou retourner la vente" className="max-w-[540px]">
      {sale && <RefundForm key={sale.id} sale={sale} onClose={onClose} />}
    </Modal>
  );
}
