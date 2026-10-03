"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Select, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import type { Product } from "@/modules/products/types";
import { useAdjustStock } from "../hooks/useAdminProducts";
import { STOCK_REASONS, type StockReason } from "../types";

interface Props {
  product: Product | null;
  onClose: () => void;
}

/** Ajustement de stock : ± quantité ou valeur fixe, motif, note, variante. Écrit l'historique des mouvements. */
export function StockAdjustModal({ product, onClose }: Props) {
  const adjust = useAdjustStock(product?.id ?? 0);
  const [mode, setMode] = useState<"delta" | "set">("delta");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState<StockReason>("restock");
  const [note, setNote] = useState("");
  const [variantId, setVariantId] = useState("");

  useEffect(() => {
    if (product) {
      setMode("delta");
      setValue("");
      setReason("restock");
      setNote("");
      setVariantId("");
    }
  }, [product]);

  if (!product) return <Modal open={false} onClose={onClose}>{null}</Modal>;
  const variant = variantId ? product.variants.find((v) => v.id === Number(variantId)) : null;
  const current = variant ? variant.stock : product.stock;
  const n = Number(value);
  const valid = value !== "" && Number.isInteger(n) && (mode === "set" ? n >= 0 : n !== 0);
  const result = valid ? Math.max(0, mode === "set" ? n : current + n) : current;

  const submit = () => {
    if (!valid) return;
    adjust.mutate(
      { mode, value: n, reason, note: note.trim() || undefined, variantId: variant?.id ?? null },
      {
        onSuccess: () => {
          toast.success("Stock mis à jour", `${product.name} : ${current} → ${result}`);
          onClose();
        },
        onError: (e) => toast.error("Ajustement impossible", getErrorMessage(e)),
      },
    );
  };

  return (
    <Modal open={!!product} onClose={onClose} title="Ajuster le stock">
      <p className="-mt-2 mb-4 line-clamp-1 text-[13px] text-ink-2">{product.name}</p>
      <div className="grid gap-4">
        {product.variants.length > 0 && (
          <Select label="Variante" value={variantId} onChange={(e) => setVariantId(e.target.value)} options={[{ value: "", label: "Choisir une variante…" }, ...product.variants.map((v) => ({ value: v.id, label: `${v.label} (${v.stock})` }))]} />
        )}
        <div className="flex gap-1 rounded-full bg-chip p-1 text-[13px] font-semibold">
          {(["delta", "set"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={cn("min-h-11 flex-1 rounded-full px-3 py-1.5 transition-colors sm:min-h-0 sm:px-4", mode === m ? "bg-primary text-white" : "text-ink-2")}>
              {m === "delta" ? "Entrée / sortie (±)" : "Définir le stock"}
            </button>
          ))}
        </div>
        <Input label={mode === "delta" ? "Quantité (+ entrée, − sortie)" : "Nouveau stock"} type="number" inputMode={mode === "delta" ? "text" : "numeric"} step="1" value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === "delta" ? "Ex : +12 ou -3" : "Ex : 40"} hint={mode === "delta" && n === 0 && value !== "" ? "La quantité ne peut pas être nulle." : undefined} />
        {mode === "delta" && (
          <div className="-mt-2 grid grid-cols-4 gap-2" aria-label="Raccourcis">
            {[-10, -1, 1, 10].map((d) => (
              <button key={d} type="button" onClick={() => setValue(String((Number(value) || 0) + d))} className={cn("h-11 rounded-box border border-line text-[14px] font-bold transition-colors active:scale-95", d < 0 ? "text-danger" : "text-primary-dark")}>{d > 0 ? `+${d}` : d}</button>
            ))}
          </div>
        )}
        <Select label="Motif" value={reason} onChange={(e) => setReason(e.target.value as StockReason)} options={STOCK_REASONS} />
        <Textarea label="Note (facultatif)" className="min-h-[70px]" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex items-center justify-between rounded-box bg-page/60 px-4 py-3 text-[14px]">
          <span className="text-ink-2">Stock actuel → après</span>
          <span className="font-bold tabular-nums">{current} <span className="text-ink-3">→</span> <span className={result <= product.stockThreshold ? "text-danger" : "text-primary-dark"}>{result}</span></span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button upper={false} onClick={submit} disabled={!valid || (product.variants.length > 0 && !variant)} loading={adjust.isPending}>Valider</Button>
        </div>
      </div>
    </Modal>
  );
}
