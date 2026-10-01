"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Add, Trash } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/shared/lib/api";
import { formatPrice } from "@/shared/lib/format";
import { CountUp } from "@/shared/animations/CountUp";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { PAYMENT_METHODS, type PaymentMethod } from "@/modules/orders/types";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { useBulkSales } from "../hooks/useSales";
import { ProductCombobox } from "./ProductCombobox";

interface Row {
  key: number;
  product: Product | null;
  price: string;
  method: PaymentMethod;
}

let k = 0;
const blank = (): Row => ({ key: ++k, product: null, price: "", method: "Cash" });

/** Saisie de plusieurs ventes d'un coup (ex-`bulk_enregistrer_vente`). */
export function BulkSaleForm() {
  const router = useRouter();
  const bulk = useBulkSales();
  const [rows, setRows] = useState<Row[]>(() => [blank(), blank()]);
  const [showErr, setShowErr] = useState(false);

  const patch = (key: number, p: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const total = rows.reduce((s, r) => s + (Number(r.price) || 0), 0);
  const valid = (r: Row) => !!r.product && Number(r.price) > 0;

  const submit = () => {
    const filled = rows.filter((r) => r.product || r.price);
    if (!filled.length || !filled.every(valid)) {
      setShowErr(true);
      toast.error("Lignes incomplètes", "Chaque ligne doit avoir un produit et un prix.");
      return;
    }
    bulk.mutate(
      filled.map((r) => ({ productId: (r.product as Product).id, priceFinal: Number(r.price), method: r.method })),
      {
        onSuccess: (res) => {
          toast.success(`${res.created} ventes enregistrées`);
          router.push(ROUTES.admin.sales);
        },
        onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
      },
    );
  };

  return (
    <Block className="grid gap-4">
      <AnimatePresence initial={false}>
        {rows.map((r, i) => (
          <motion.div
            key={r.key}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-box border border-line-3 bg-page/30 p-4 [&:has([aria-expanded=true])]:relative [&:has([aria-expanded=true])]:z-20"
          >
            <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,2fr)_150px_190px_auto]">
              <ProductCombobox
                compact
                label={`Produit ${i + 1}`}
                value={r.product}
                error={showErr && !r.product && (r.price || rows.length === 1) ? "Requis" : undefined}
                onChange={(p) => patch(r.key, { product: p, price: String(getPricing(p).current) })}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold">Prix final ($)</span>
                <input type="number" min="0" step="0.01" value={r.price} onChange={(e) => patch(r.key, { price: e.target.value })} aria-label={`Prix ligne ${i + 1}`} aria-invalid={showErr && !!r.product && !(Number(r.price) > 0)} className="field" />
              </div>
              <Select label="Paiement" value={r.method} onChange={(e) => patch(r.key, { method: e.target.value as PaymentMethod })} options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))} />
              <button
                type="button"
                aria-label="Supprimer la ligne"
                disabled={rows.length === 1}
                onClick={() => setRows((s) => s.filter((x) => x.key !== r.key))}
                className="mt-6 grid size-[45px] place-items-center rounded-full bg-chip transition-colors hover:bg-danger hover:text-white disabled:opacity-40 disabled:hover:bg-chip disabled:hover:text-ink"
              >
                <Trash size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button variant="chip" upper={false} leftIcon={<Add size={16} />} onClick={() => setRows((r) => [...r, blank()])} className="justify-self-start">Ajouter une ligne</Button>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line-3 pt-5">
        <p className="text-[14px] text-ink-2">{rows.filter(valid).length} vente(s) · Total <strong className="ml-1 text-[22px] text-primary"><CountUp to={total} format={formatPrice} duration={0.5} /></strong></p>
        <div className="flex gap-3">
          <Button variant="chip" upper={false} onClick={() => router.push(ROUTES.admin.sales)}>Annuler</Button>
          <Button upper={false} loading={bulk.isPending} onClick={submit}>Enregistrer tout</Button>
        </div>
      </div>
    </Block>
  );
}
