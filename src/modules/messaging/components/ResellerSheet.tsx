"use client";

import { SearchNormal1, TickCircle } from "iconsax-reactjs";
import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/Avatar";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Button } from "@/shared/ui/Button";
import type { ResellerOption } from "../services/notifications.service";

const DOT = { online: "bg-primary", away: "bg-star", offline: "bg-ink-3" } as const;
const LABEL = { online: "En ligne", away: "Absent", offline: "Hors ligne" } as const;

interface Props {
  open: boolean;
  onClose: () => void;
  options: ResellerOption[];
  value: string;
  onChange: (id: string) => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
}

/**
 * Sélection d'un revendeur en feuille (mobile) : recherche nom/code, pastille de présence, charge de travail,
 * bouton de confirmation collé en bas. Équivalent tactile de `ResellerCombobox`.
 */
export function ResellerSheet({ open, onClose, options, value, onChange, onConfirm, loading, title = "Assigner à un revendeur" }: Props) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => `${o.name} ${o.code ?? ""}`.toLowerCase().includes(s)) : options;
  }, [options, q]);

  return (
    <BottomSheet open={open} onClose={onClose} title={title} maxVh={88}>
      <div className="sticky top-0 z-10 -mx-5 bg-white px-5 pb-2 pt-1">
        <div className="relative">
          <SearchNormal1 size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Nom ou code… (${options.length} revendeurs)`} aria-label="Rechercher un revendeur" className="field pl-10" />
        </div>
      </div>

      <ul role="listbox" className="space-y-1 pb-2">
        {list.length === 0 && <li className="px-3 py-8 text-center text-[14px] text-ink-3">Aucun revendeur trouvé</li>}
        {list.map((o) => {
          const selected = String(o.id) === value;
          const av = o.availability ?? "online";
          return (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onChange(String(o.id))}
                className={cn("flex min-h-[64px] w-full items-center gap-3 rounded-box px-2.5 py-2 text-left transition-all active:scale-[0.985]", selected ? "bg-primary-50 ring-1 ring-primary/40" : "active:bg-chip")}
              >
                <span className="relative shrink-0">
                  <Avatar name={o.name} size={44} />
                  <span className={cn("absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full ring-2 ring-white", DOT[av])} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold leading-[20px]">{o.name}</span>
                  <span className="text-[12px] text-ink-3">
                    {LABEL[av]}
                    {o.code ? ` · code ${o.code}` : ""}
                  </span>
                </span>
                {o.openOrders != null && <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", o.openOrders > 4 ? "bg-danger-100 text-danger" : "bg-chip text-ink-2")}>{o.openOrders} en cours</span>}
                {selected && <TickCircle size={22} variant="Bold" className="shrink-0 text-primary" />}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-0 -mx-5 border-t border-line-3 bg-white px-5 pb-1 pt-3">
        <Button fullWidth upper={false} size="md" loading={loading} disabled={!value} onClick={onConfirm}>
          Confirmer l&apos;assignation
        </Button>
      </div>
    </BottomSheet>
  );
}
