"use client";

import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";

interface Props {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}

function range(page: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < count - 1) out.push("…");
  out.push(count);
  return out;
}

/**
 * Pagination. Mobile (< sm) : « ‹ Précédent · 2 / 8 · Suivant › » (grandes cibles tactiles).
 * ≥ sm : liste de pages numérotées.
 */
export function Pagination({ page, pageCount, onChange, className }: Props) {
  if (pageCount <= 1) return null;
  const base = "grid size-10 place-items-center rounded-full text-[14px] font-semibold transition-colors";
  const nav = "bg-chip hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-chip disabled:hover:text-ink";
  return (
    <nav aria-label="Pagination" className={cn("px-3", className)}>
      {/* mobile */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className={cn("flex h-12 flex-1 items-center justify-center gap-1 rounded-box text-[13px] font-semibold active:scale-[0.97]", nav)}>
          <ArrowLeft2 size={16} /> Précédent
        </button>
        <span className="min-w-[64px] text-center text-[13px] font-bold tabular-nums">
          {page} <span className="font-normal text-ink-3">/ {pageCount}</span>
        </span>
        <button disabled={page >= pageCount} onClick={() => onChange(page + 1)} className={cn("flex h-12 flex-1 items-center justify-center gap-1 rounded-box text-[13px] font-semibold active:scale-[0.97]", nav)}>
          Suivant <ArrowRight2 size={16} />
        </button>
      </div>
      {/* ≥ sm */}
      <div className="hidden items-center justify-center gap-1.5 sm:flex">
        <button aria-label="Page précédente" disabled={page <= 1} onClick={() => onChange(page - 1)} className={cn(base, nav)}>
          <ArrowLeft2 size={16} />
        </button>
        {range(page, pageCount).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-ink-3">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined} className={cn(base, p === page ? "bg-primary text-white" : "hover:bg-chip")}>
              {p}
            </button>
          ),
        )}
        <button aria-label="Page suivante" disabled={page >= pageCount} onClick={() => onChange(page + 1)} className={cn(base, nav)}>
          <ArrowRight2 size={16} />
        </button>
      </div>
    </nav>
  );
}
