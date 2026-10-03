"use client";

import { ArrowDown2, Element3, Filter, HamburgerMenu, Sort } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { pluralize } from "@/shared/lib/format";
import { Select } from "@/shared/ui/Form";
import type { ProductOrdering } from "../types";

export type ViewMode = "grid" | "list";

const SORTS: { value: ProductOrdering; label: string }[] = [
  { value: "-created_at", label: "Nouveautés" },
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

/**
 * Barre d'outils de la liste.
 * Mobile : compteur + rangée collante sous l'en-tête [Filtres (n)] [Trier ▾] [grille|liste] ;
 * desktop : une seule ligne (compteur, filtres masqués ≥ lg, tri, vues).
 */
export function ProductToolbar({ total, loading, ordering, onOrderingChange, view, onViewChange, onOpenFilters, activeFilters }: Props) {
  const seg = (active: boolean) => cn("grid size-10 place-items-center rounded-[10px] transition-colors sm:size-[45px] sm:rounded-box", active ? "bg-primary text-white" : "text-ink-2 hover:bg-chip-3");
  const count = loading || total == null ? "Chargement…" : <><strong className="text-ink">{pluralize(total, "produit")}</strong> trouvé{total > 1 ? "s" : ""}</>;

  return (
    <div className="border-b border-line-3 pb-3 sm:pb-5">
      <p className="mb-2 text-[13px] text-ink-2 sm:hidden" aria-live="polite">{count}</p>

      <div className="flex items-center gap-2 max-sm:sticky max-sm:top-[61px] max-sm:z-30 max-sm:-mx-3 max-sm:bg-white/95 max-sm:px-3 max-sm:py-2 max-sm:backdrop-blur-md sm:flex-wrap sm:gap-3 sm:max-lg:gap-3">
        <p className="mr-auto hidden text-[14px] text-ink-2 sm:block" aria-live="polite">{count}</p>

        <button onClick={onOpenFilters} className="relative flex h-11 shrink-0 items-center gap-2 rounded-box bg-chip px-4 text-[13px] font-bold active:scale-[0.97] sm:h-[45px] lg:hidden">
          <Filter size={18} /> Filtres
          {activeFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-white">{activeFilters}</span>}
        </button>

        {/* mobile : sélecteur natif compact (feuille système) ; ≥ sm : Select du design */}
        <div className="relative min-w-0 flex-1 sm:hidden">
          <Sort size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" />
          <select
            aria-label="Trier par"
            value={ordering}
            onChange={(e) => onOrderingChange(e.target.value as ProductOrdering)}
            className="h-11 w-full appearance-none truncate rounded-box bg-chip pl-9 pr-8 text-[16px] font-semibold outline-none focus:ring-2 focus:ring-primary"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ArrowDown2 size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        <Select aria-label="Trier par" value={ordering} onChange={(e) => onOrderingChange(e.target.value as ProductOrdering)} options={SORTS} wrapperClassName="hidden w-[190px] sm:flex" />

        <div className="flex shrink-0 gap-1 rounded-box bg-chip p-1 sm:gap-2 sm:bg-transparent sm:p-0">
          <button aria-label="Vue grille" aria-pressed={view === "grid"} onClick={() => onViewChange("grid")} className={seg(view === "grid")}>
            <Element3 size={18} variant={view === "grid" ? "Bold" : "Linear"} />
          </button>
          <button aria-label="Vue liste" aria-pressed={view === "list"} onClick={() => onViewChange("list")} className={seg(view === "list")}>
            <HamburgerMenu size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
