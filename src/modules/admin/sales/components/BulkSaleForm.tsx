"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Add, Trash } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { CountUp } from "@/shared/animations/CountUp";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Form";
import { QuantityStepper } from "@/shared/ui/QuantityStepper";
import { toast } from "@/shared/ui/Toast";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { useCreateSales } from "../hooks/useSales";
import { METHOD_STYLE, type PaymentMethod } from "../types";
import { fieldErrorsOf, todayStr } from "../utils";
import { ProductCombobox } from "./ProductCombobox";

interface Line {
  key: number;
  product: Product | null;
  quantity: number;
  price: string;
  /** « vendu à » propre à la ligne (sinon client global) */
  venduA: string;
}

const METHOD_OPTIONS = (Object.keys(METHOD_STYLE) as PaymentMethod[]).map((m) => ({ value: m, label: METHOD_STYLE[m].label }));
let seq = 1;
const blank = (): Line => ({ key: seq++, product: null, quantity: 1, price: "", venduA: "" });

/** Ventes multiples (lignes libres) : date, moyen de paiement et client communs ; quantité, prix et client modifiables par ligne. */
export function BulkSaleForm() {
  const router = useRouter();
  const create = useCreateSales();
  const [lines, setLines] = useState<Line[]>(() => [blank(), blank()]);
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [soldAt, setSoldAt] = useState(todayStr());
  const [venduA, setVenduA] = useState("");
  const [error, setError] = useState("");

  const patch = (key: number, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const total = lines.reduce((n, l) => n + (Number(l.price) || 0) * l.quantity, 0);
  const filled = lines.filter((l) => l.product);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!filled.length) return setError("Ajoutez au moins un produit.");
    if (filled.some((l) => l.price === "" || Number(l.price) < 0)) return setError("Renseignez le prix final de chaque ligne.");
    if (!soldAt) return setError("La date de vente est requise.");
    setError("");
    create.mutate(
      filled.map((l) => ({ productId: l.product!.id, quantity: l.quantity, unitPrice: Number(l.price), method, soldAt, venduA: l.venduA || venduA })),
      {
        onSuccess: (res) => {
          toast.success(`${res.length} vente${res.length > 1 ? "s" : ""} enregistrée${res.length > 1 ? "s" : ""}`, formatPrice(total));
          router.push(ROUTES.admin.sales);
        },
        onError: (er) => setError(fieldErrorsOf(er).lines ?? getErrorMessage(er)),
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3 sm:space-y-4">
      <Block pad="none" className="grid gap-4 p-4 sm:grid-cols-3 sm:gap-5 sm:p-[30px]">
        <Input label="Date de la vente" required type="date" max={todayStr()} value={soldAt} onChange={(e) => setSoldAt(e.target.value)} />
        <Select label="Moyen de paiement" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} options={METHOD_OPTIONS} />
        <Input label="Client (toutes les lignes)" value={venduA} onChange={(e) => setVenduA(e.target.value)} maxLength={50} placeholder="Vendu à… (facultatif)" hint="Peut être remplacé ligne par ligne." />
      </Block>

      <Block pad="none" className="space-y-4 p-4 sm:p-[30px]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[16px]">Lignes de vente <span className="text-ink-3">({lines.length})</span></h3>
          <Button type="button" variant="chip" size="sm" upper={false} leftIcon={<Add size={16} />} onClick={() => setLines((l) => [...l, blank()])}>Ajouter</Button>
        </div>
        <div className="space-y-3">
          {lines.map((l, i) => (
            <div key={l.key} className="grid min-w-0 items-end gap-3 rounded-box border border-line-3 p-3.5 lg:grid-cols-[minmax(0,2fr)_130px_130px_minmax(0,1fr)_40px] lg:p-3">
              {/* mobile : en-tête de carte avec suppression */}
              <div className="flex items-center justify-between lg:hidden">
                <span className="text-[12px] font-bold uppercase tracking-wide text-ink-3">Ligne {i + 1}</span>
                <button type="button" aria-label="Supprimer la ligne" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="grid size-11 place-items-center rounded-full bg-chip transition-colors active:scale-90 disabled:opacity-40">
                  <Trash size={18} />
                </button>
              </div>
              {/* sur desktop, seules les étiquettes de la 1ʳᵉ ligne sont visibles (grille alignée) */}
              <div className={i > 0 ? "min-w-0 lg:[&_label]:sr-only" : "min-w-0"}>
                <ProductCombobox value={l.product} compact label="Produit" onChange={(p) => patch(l.key, { product: p, price: String(getPricing(p).current) })} />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:contents">
                <div className="flex flex-col gap-1.5">
                  <span className={i > 0 ? "text-[13px] font-semibold lg:sr-only" : "text-[13px] font-semibold"}>Quantité</span>
                  <QuantityStepper value={l.quantity} onChange={(q) => patch(l.key, { quantity: q })} max={999} className="w-full max-sm:justify-between" />
                </div>
                <div className={i > 0 ? "lg:[&_label]:sr-only" : ""}>
                  <Input label="Prix unitaire ($)" type="number" inputMode="decimal" min={0} step="0.01" value={l.price} onChange={(e) => patch(l.key, { price: e.target.value })} aria-label="Prix unitaire" />
                </div>
              </div>
              <div className={i > 0 ? "lg:[&_label]:sr-only" : ""}>
                <Input label="Vendu à" value={l.venduA} onChange={(e) => patch(l.key, { venduA: e.target.value })} maxLength={50} placeholder={venduA || "Client…"} aria-label="Vendu à" />
              </div>
              <button type="button" aria-label="Supprimer la ligne" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="hidden size-10 place-items-center rounded-full bg-chip transition-colors hover:bg-danger hover:text-white disabled:opacity-40 disabled:hover:bg-chip disabled:hover:text-ink lg:grid">
                <Trash size={17} />
              </button>
            </div>
          ))}
        </div>
        {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      </Block>

      <Block pad="none" className="hidden flex-wrap items-center justify-between gap-4 p-[30px] lg:flex">
        <p className="text-[14px] text-ink-2">{filled.length} ligne{filled.length > 1 ? "s" : ""} · Total <strong className="ml-1 text-[22px] text-primary"><CountUp to={total} format={formatPrice} duration={0.6} /></strong></p>
        <div className="flex gap-2">
          <Button variant="chip" upper={false} href={ROUTES.admin.sales}>Annuler</Button>
          <Button type="submit" loading={create.isPending} upper={false}>Valider les ventes</Button>
        </div>
      </Block>

      {/* < lg : barre d'actions fixe au-dessus de la barre d'onglets */}
      <div className="h-20 lg:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-[max(var(--tabbar-h),env(safe-area-inset-bottom))] z-40 flex items-center gap-3 border-t border-line-3 bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{filled.length} ligne{filled.length > 1 ? "s" : ""} · Total</p>
          <p className="truncate text-[20px] font-bold leading-[24px] text-primary">{formatPrice(total)}</p>
        </div>
        <Button type="submit" loading={create.isPending} upper={false} className="min-w-[150px]">Valider</Button>
      </div>
    </form>
  );
}
