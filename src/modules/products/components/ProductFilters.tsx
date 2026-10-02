"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { Checkbox } from "@/shared/ui/Form";
import { Button } from "@/shared/ui/Button";
import type { Category } from "@/modules/categories/types";
import { PRICE_MAX, type ProductFilterState } from "../hooks/useProductFilters";

interface Props {
  state: ProductFilterState;
  categories?: Category[];
  /** Masque le groupe catégories (page catégorie). */
  hideCategories?: boolean;
  onChange: (patch: Partial<ProductFilterState>) => void;
  onReset: () => void;
  activeCount: number;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line-3 py-5 first:pt-0 last:border-0">
      <h3 className="mb-3 text-[14px] font-bold uppercase leading-[21px]">{title}</h3>
      {children}
    </section>
  );
}

/** Curseur double (prix min / max), validé après 400 ms d'inactivité. */
function PriceRange({ min, max, onCommit }: { min: number | null; max: number | null; onCommit: (min: number | null, max: number | null) => void }) {
  const [lo, setLo] = useState(min ?? 0);
  const [hi, setHi] = useState(max ?? PRICE_MAX);

  useEffect(() => {
    setLo(min ?? 0);
    setHi(max ?? PRICE_MAX);
  }, [min, max]);

  useEffect(() => {
    const id = setTimeout(() => {
      const nMin = lo > 0 ? lo : null;
      const nMax = hi < PRICE_MAX ? hi : null;
      if (nMin !== min || nMax !== max) onCommit(nMin, nMax);
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lo, hi]);

  const thumb =
    "pointer-events-none absolute inset-0 h-7 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-[26px] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-[24px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white";

  return (
    <div>
      <div className="relative mx-3 mt-2 h-7">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line-3" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${(lo / PRICE_MAX) * 100}%`, right: `${100 - (hi / PRICE_MAX) * 100}%` }}
        />
        <input type="range" aria-label="Prix minimum" min={0} max={PRICE_MAX} step={10} value={lo} onChange={(e) => setLo(Math.min(Number(e.target.value), hi - 10))} className={thumb} />
        <input type="range" aria-label="Prix maximum" min={0} max={PRICE_MAX} step={10} value={hi} onChange={(e) => setHi(Math.max(Number(e.target.value), lo + 10))} className={thumb} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[13px] font-semibold">
        <span className="rounded-md bg-chip px-2.5 py-1">{formatPrice(lo)}</span>
        <span className="text-ink-3">—</span>
        <span className="rounded-md bg-chip px-2.5 py-1">{hi >= PRICE_MAX ? `${formatPrice(PRICE_MAX)}+` : formatPrice(hi)}</span>
      </div>
    </div>
  );
}

export function ProductFilters({ state, categories, hideCategories, onChange, onReset, activeCount }: Props) {
  return (
    <div>
      {!hideCategories && (
        <Group title="Catégories">
          <ul className="flex flex-col">
            <li>
              <button
                onClick={() => onChange({ category: null })}
                className={cn("flex w-full items-center justify-between rounded-md px-2 py-2.5 text-[14px] transition-colors hover:bg-chip active:bg-chip sm:py-1.5 sm:text-[13px]", !state.category && "font-bold text-primary")}
              >
                Toutes les catégories
              </button>
            </li>
            {categories?.map((c) => {
              const active = state.category === c.id;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => onChange({ category: active ? null : c.id })}
                    className={cn("flex w-full items-center justify-between rounded-md px-2 py-2.5 text-[14px] transition-colors hover:bg-chip active:bg-chip sm:py-1.5 sm:text-[13px]", active && "bg-primary-50 font-bold text-primary")}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className={cn("ml-2 rounded-full px-2 text-[11px]", active ? "bg-primary text-white" : "bg-chip text-ink-2")}>{c.productsCount}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Group>
      )}

      <Group title="Prix">
        <PriceRange min={state.minPrice} max={state.maxPrice} onCommit={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })} />
      </Group>

      <Group title="Disponibilité">
        <div className="flex flex-col gap-4 sm:gap-3">
          <Checkbox label="En stock uniquement" checked={state.inStock} onChange={(e) => onChange({ inStock: e.target.checked })} />
          <Checkbox label="En promotion" checked={state.onSale} onChange={(e) => onChange({ onSale: e.target.checked })} />
        </div>
      </Group>

      {activeCount > 0 && (
        <Button variant="chip" size="sm" fullWidth onClick={onReset} upper={false} className="mt-2">
          Réinitialiser les filtres ({activeCount})
        </Button>
      )}
    </div>
  );
}
