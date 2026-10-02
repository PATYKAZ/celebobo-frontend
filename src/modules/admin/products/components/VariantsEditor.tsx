"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type KeyboardEvent } from "react";
import { Add, CloseCircle, Trash } from "iconsax-reactjs";
import { formatPrice } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import type { VariantOption } from "@/modules/products/types";
import type { VariantRow } from "../types";

interface Props {
  options: VariantOption[];
  rows: VariantRow[];
  basePrice: number;
  onChange: (next: { options: VariantOption[]; rows: VariantRow[] }) => void;
  error?: string;
}

const keyOf = (a: Record<string, string>) => Object.entries(a).sort(([x], [y]) => x.localeCompare(y)).map(([k, v]) => `${k}=${v}`).join("|");

/** Produit cartésien des options valides ; conserve prix / stock / SKU des lignes existantes. */
function regenerate(options: VariantOption[], prev: VariantRow[]): VariantRow[] {
  const valid = options.filter((o) => o.name.trim() && o.values.length);
  if (!valid.length) return [];
  const combos = valid.reduce<Record<string, string>[]>((acc, o) => acc.flatMap((a) => o.values.map((v) => ({ ...a, [o.name.trim()]: v }))), [{}]);
  const known = new Map(prev.map((r) => [keyOf(r.attributes), r]));
  return combos.map((attributes, i) => {
    const old = known.get(keyOf(attributes));
    return old ?? { id: Date.now() + i, attributes, label: Object.values(attributes).join(" / "), price: "", stock: "0", sku: "" };
  });
}

/** Éditeur de variantes : options (Couleur, Stockage…) → grille de combinaisons avec prix, stock et SKU propres. */
export function VariantsEditor({ options, rows, basePrice, onChange, error }: Props) {
  const [draft, setDraft] = useState<Record<number, string>>({});

  const update = (nextOptions: VariantOption[]) => onChange({ options: nextOptions, rows: regenerate(nextOptions, rows) });
  const setRow = (id: number, patch: Partial<VariantRow>) => onChange({ options, rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const addValue = (i: number) => {
    const v = (draft[i] ?? "").trim();
    if (!v || options[i].values.includes(v)) return;
    update(options.map((o, j) => (j === i ? { ...o, values: [...o.values, v] } : o)));
    setDraft((d) => ({ ...d, [i]: "" }));
  };
  const onKey = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addValue(i);
    }
  };

  const total = rows.reduce((n, r) => n + (Number(r.stock) || 0), 0);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <AnimatePresence initial={false}>
          {options.map((o, i) => (
            <motion.div key={i} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-box border border-line p-4">
              <div className="flex items-center gap-3">
                <input
                  value={o.name}
                  onChange={(e) => update(options.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  placeholder="Nom de l'option (Couleur, Stockage…)"
                  aria-label="Nom de l'option"
                  className="field max-w-[280px] font-semibold"
                />
                <button type="button" onClick={() => update(options.filter((_, j) => j !== i))} aria-label="Supprimer l'option" className="ml-auto grid size-9 place-items-center rounded-full bg-chip text-ink-2 transition-colors hover:bg-danger hover:text-white">
                  <Trash size={16} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {o.values.map((v) => (
                  <span key={v} className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 py-1.5 pl-3.5 pr-2 text-[13px] font-medium text-primary-dark">
                    {v}
                    <button type="button" aria-label={`Retirer ${v}`} onClick={() => update(options.map((x, j) => (j === i ? { ...x, values: x.values.filter((y) => y !== v) } : x)))} className="text-primary-dark/60 hover:text-danger">
                      <CloseCircle size={16} variant="Bold" />
                    </button>
                  </span>
                ))}
                <input
                  value={draft[i] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [i]: e.target.value }))}
                  onKeyDown={onKey(i)}
                  onBlur={() => addValue(i)}
                  placeholder="Ajouter une valeur + Entrée"
                  aria-label="Nouvelle valeur"
                  className="h-9 min-w-[180px] flex-1 rounded-full border border-dashed border-line bg-white px-3 text-[13px] outline-none focus:border-primary"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {options.length < 3 && (
          <Button variant="chip" upper={false} size="sm" className="self-start" leftIcon={<Add size={16} />} onClick={() => update([...options, { name: "", values: [] }])}>
            Ajouter une option
          </Button>
        )}
      </div>

      {rows.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="font-semibold">{rows.length} variante{rows.length > 1 ? "s" : ""}</span>
            <span className="text-ink-2">Stock total : <strong className="text-ink">{total}</strong></span>
          </div>
          <div className="overflow-x-auto rounded-box border border-line">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="bg-page/60 text-left text-[11px] uppercase tracking-wide text-ink-3">
                <tr><th className="px-3 py-2">Variante</th><th className="px-3 py-2">Prix ($)</th><th className="px-3 py-2">Stock</th><th className="px-3 py-2">SKU</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line-3">
                    <td className="px-3 py-2 font-semibold">{r.label}</td>
                    <td className="px-3 py-2"><input type="number" min="0" step="0.01" value={r.price} onChange={(e) => setRow(r.id, { price: e.target.value })} placeholder={basePrice ? formatPrice(basePrice) : "Prix du produit"} aria-label={`Prix ${r.label}`} className="field !h-9 w-[130px]" /></td>
                    <td className="px-3 py-2"><input type="number" min="0" step="1" value={r.stock} onChange={(e) => setRow(r.id, { stock: e.target.value })} aria-label={`Stock ${r.label}`} className="field !h-9 w-[90px]" /></td>
                    <td className="px-3 py-2"><input value={r.sku} onChange={(e) => setRow(r.id, { sku: e.target.value })} aria-label={`SKU ${r.label}`} className="field !h-9 w-[150px]" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12px] text-ink-3">Laissez le prix vide pour reprendre celui du produit. Le stock du produit est la somme des variantes.</p>
        </div>
      )}
      {error && <p role="alert" className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
