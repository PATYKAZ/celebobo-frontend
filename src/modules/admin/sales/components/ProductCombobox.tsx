"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowDown2, SearchNormal1 } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { useProducts } from "@/modules/products/hooks/useProducts";

interface Props {
  value: Product | null;
  onChange: (p: Product) => void;
  error?: string;
  label?: string;
  compact?: boolean;
}

/** Sélecteur de produit avec recherche et vignettes. */
export function ProductCombobox({ value, onChange, error, label, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 250);
  const { data, isFetching } = useProducts({ search: dq, pageSize: 8 }, open);
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 639px)");

  useEffect(() => {
    if (!open || isMobile) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, isMobile]);

  const search = (
    <div className="relative mb-2">
      <SearchNormal1 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
      <input autoFocus={!isMobile} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher un produit" inputMode="search" className="field h-12 pl-9 sm:h-10" />
    </div>
  );
  const list = (
    <ul role="listbox" className="max-h-none overflow-y-auto sm:max-h-[300px]">
      {data?.results.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            role="option"
            aria-selected={value?.id === p.id}
            onClick={() => {
              onChange(p);
              setOpen(false);
            }}
            className={cn("flex min-h-14 w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-chip active:bg-chip", value?.id === p.id && "bg-primary-50")}
          >
            <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-page sm:size-10">{p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold">{p.name}</span>
              <span className="text-[12px] text-ink-3">{p.category} · <span className={p.stock <= 0 ? "text-danger" : p.stock <= p.stockThreshold ? "text-[#b87400]" : ""}>stock {p.stock}</span></span>
            </span>
            <span className="text-[13px] font-semibold text-primary">{formatPrice(getPricing(p).current)}</span>
          </button>
        </li>
      ))}
      {!data?.results.length && <li className="px-3 py-4 text-[13px] text-ink-3">{isFetching ? "Recherche…" : "Aucun produit trouvé."}</li>}
    </ul>
  );

  return (
    <div ref={ref} className="relative flex flex-col gap-1.5">
      {label && <label className="text-[13px] font-semibold">{label}<span className="ml-0.5 text-danger">*</span></label>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={!!error}
        onClick={() => setOpen((o) => !o)}
        className={cn("field flex items-center gap-3 text-left", compact && "h-[45px]", error && "field-error")}
      >
        {value ? (
          <>
            <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-page">{value.image && <Image src={value.image} alt="" fill sizes="32px" className="object-cover" />}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{value.name}</span>
          </>
        ) : (
          <span className="flex-1 text-ink-3">Choisir un produit…</span>
        )}
        <ArrowDown2 size={14} className={cn("shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {error && <p role="alert" className="text-[12px] text-danger">{error}</p>}

      {open && !isMobile && (
        <div className="absolute inset-x-0 top-full z-40 mt-1 animate-fade-in rounded-box border border-line-3 bg-white p-2 shadow-[0_12px_40px_rgba(0,0,0,.14)]">
          {search}
          {list}
        </div>
      )}
      {/* mobile : feuille plein confort avec recherche */}
      <BottomSheet open={open && isMobile} onClose={() => setOpen(false)} title="Choisir un produit">
        <div className="pb-3 pt-1">
          {search}
          {list}
        </div>
      </BottomSheet>
    </div>
  );
}
