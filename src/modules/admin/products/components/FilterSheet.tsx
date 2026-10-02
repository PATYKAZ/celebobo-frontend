"use client";

import { CloseCircle, Filter } from "iconsax-reactjs";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Button } from "@/shared/ui/Button";
import { ScrollRow } from "@/shared/ui/ScrollRow";

/** Bouton « Filtrer » (mobile) avec pastille du nombre de filtres actifs. */
export function FilterTrigger({ count, onClick, className }: { count: number; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className={cn("relative inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-box border px-4 text-[14px] font-semibold transition-colors active:scale-[0.97]", count > 0 ? "border-primary bg-primary-50 text-primary-dark" : "border-line bg-white", className)}
    >
      <Filter size={18} variant={count > 0 ? "Bold" : "Linear"} />
      Filtrer
      {count > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-5 text-white">{count}</span>}
    </button>
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Réinitialise tous les filtres */
  onReset?: () => void;
  resetDisabled?: boolean;
  children: ReactNode;
}

/** Feuille de filtres : champs défilants, « Réinitialiser » / « Voir les résultats » épinglés en bas. */
export function FilterSheet({ open, onClose, title = "Filtres", onReset, resetDisabled, children }: SheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="space-y-4 pb-4 pt-1">{children}</div>
      <div className="sticky bottom-0 -mx-5 grid grid-cols-2 gap-3 border-t border-line-3 bg-white px-5 py-3 pb-safe">
        <Button variant="chip" upper={false} disabled={resetDisabled} onClick={() => onReset?.()}>Réinitialiser</Button>
        <Button upper={false} onClick={onClose}>Voir les résultats</Button>
      </div>
    </BottomSheet>
  );
}

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** Rangée de pastilles « filtre actif ✕ » sous la barre de recherche (mobile). */
export function ActiveChips({ chips, className }: { chips: FilterChip[]; className?: string }) {
  if (!chips.length) return null;
  return (
    <ScrollRow bleed className={cn("gap-1.5", className)}>
      {chips.map((c) => (
        <button key={c.key} type="button" onClick={c.onRemove} aria-label={`Retirer le filtre ${c.label}`} className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary-100 pl-3.5 pr-2 text-[12px] font-semibold text-primary-dark active:scale-95">
          {c.label}
          <CloseCircle size={16} variant="Bold" />
        </button>
      ))}
    </ScrollRow>
  );
}

/** Champ de recherche pleine largeur 48 px (mobile) avec bouton « Filtrer » à côté. */
export function MobileSearchRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 sm:hidden">{children}</div>;
}
