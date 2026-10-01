"use client";

import { Element3, Filter, HamburgerMenu } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { pluralize } from "@/shared/lib/format";
import { Select } from "@/shared/ui/Form";
import type { ProductOrdering } from "../types";

export type ViewMode = "grid" | "list";

const SORTS: { value: ProductOrdering; label: string }[] = [
  { value: "-date_added", label: "Nouveautés" },
  { value: "price", label: "Prix croissant" },
  { value: "-price", label: "Prix décroissant" },
  { value: "-sales", label: "Meilleures ventes" },
  { value: "-rating", label: "Mieux notés" },
  { value: "name", label: "Nom (A-Z)" },
];

interface Props {
  total?: number;
  loading?: boolean;
  ordering: ProductOrdering;
  onOrderingChange: (o: ProductOrdering) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onOpenFilters: () => void;
  activeFilters: number;
}

export function ProductToolbar({ total, loading, ordering, onOrderingChange, view, onViewChange, onOpenFilters, activeFilters }: Props) {
  const btn = (active: boolean) => cn("grid size-[45px] place-items-center rounded-box transition-colors", active ? "bg-primary text-white" : "bg-chip hover:bg-chip-3");
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line-3 pb-5">
      <p className="mr-auto text-[14px] text-ink-2" aria-live="polite">
        {loading || total == null ? "Chargement…" : <><strong className="text-ink">{pluralize(total, "produit")}</strong> trouvé{total > 1 ? "s" : ""}</>}
      </p>
      <button onClick={onOpenFilters} className="relative flex h-[45px] items-center gap-2 rounded-box bg-chip px-4 text-[13px] font-bold lg:hidden">
        <Filter size={18} /> Filtres
        {activeFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-white">{activeFilters}</span>}
      </button>
      <Select
        aria-label="Trier par"
        value={ordering}
        onChange={(e) => onOrderingChange(e.target.value as ProductOrdering)}
        options={SORTS}
        wrapperClassName="w-[190px]"
      />
      <div className="hidden gap-2 sm:flex">
        <button aria-label="Vue grille" aria-pressed={view === "grid"} onClick={() => onViewChange("grid")} className={btn(view === "grid")}>
          <Element3 size={18} variant={view === "grid" ? "Bold" : "Linear"} />
        </button>
        <button aria-label="Vue liste" aria-pressed={view === "list"} onClick={() => onViewChange("list")} className={btn(view === "list")}>
          <HamburgerMenu size={18} />
        </button>
      </div>
    </div>
  );
}
