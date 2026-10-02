"use client";

import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";

interface Props {
  onPrev: () => void;
  onNext: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  className?: string;
}

/** Petites flèches de titre de section : 70×25, fond #EBEDF3, rad 30. */
export function SliderArrows({ onPrev, onNext, canPrev = true, canNext = true, className }: Props) {
  const b = "grid h-full flex-1 place-items-center transition-all hover:text-primary disabled:opacity-35 disabled:hover:text-ink";
  return (
    <div className={cn("flex h-[25px] w-[70px] items-center overflow-hidden rounded-pill bg-chip-2 max-sm:h-9 max-sm:w-[92px]", className)}>
      <button aria-label="Précédent" onClick={onPrev} disabled={!canPrev} className={b}>
        <ArrowLeft2 size={12} variant="Bold" />
      </button>
      <button aria-label="Suivant" onClick={onNext} disabled={!canNext} className={b}>
        <ArrowRight2 size={12} variant="Bold" />
      </button>
    </div>
  );
}

/** Grandes flèches latérales (carrousel produits) : 40×80, #EDEFF6, rad 6. */
export function SideArrow({ dir, onClick, disabled, className }: { dir: "prev" | "next"; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      aria-label={dir === "prev" ? "Précédent" : "Suivant"}
      onClick={onClick}
      disabled={disabled}
      className={cn("absolute top-1/2 z-10 hidden h-20 w-10 -translate-y-1/2 place-items-center rounded-md bg-chip-3 transition-all hover:bg-primary hover:text-white disabled:opacity-35 disabled:hover:bg-chip-3 disabled:hover:text-ink lg:grid", dir === "prev" ? "left-0" : "right-0", className)}
    >
      {dir === "prev" ? <ArrowLeft2 size={18} variant="Bold" /> : <ArrowRight2 size={18} variant="Bold" />}
    </button>
  );
}
