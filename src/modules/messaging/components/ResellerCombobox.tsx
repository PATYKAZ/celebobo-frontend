"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/Avatar";
import { Combobox } from "@/shared/ui/Combobox";
import type { ResellerOption } from "../services/notifications.service";

const DOT = { online: "bg-primary", away: "bg-star", offline: "bg-ink-3" } as const;
const LABEL = { online: "En ligne", away: "Absent", offline: "Hors ligne" } as const;

interface Props {
  options: ResellerOption[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}

/** Sélecteur compact avec recherche (nom ou code) — pour assigner parmi TOUS les revendeurs actifs. */
export function ResellerCombobox({ options, value, onChange, label = "Assigner à un revendeur", className }: Props) {
  const [q, setQ] = useState("");
  const selected = options.find((o) => String(o.id) === value);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => `${o.name} ${o.code ?? ""}`.toLowerCase().includes(s)) : options;
  }, [options, q]);

  return (
    <Combobox
      className={className}
      label={label}
      ariaLabel="Choisir un revendeur"
      items={list}
      getKey={(o) => String(o.id)}
      selectedKey={value}
      onSelect={(o) => onChange(String(o.id))}
      renderItem={(o) => (
        <>
          <span className="relative">
            <Avatar name={o.name} size={30} />
            <span className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white", DOT[o.availability ?? "online"])} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold leading-[18px]">{o.name}</span>
            <span className="text-[11px] text-ink-3">
              {LABEL[o.availability ?? "online"]}
              {o.code ? ` · code ${o.code}` : ""}
            </span>
          </span>
          {o.openOrders != null && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", o.openOrders > 4 ? "bg-danger-100 text-danger" : "bg-chip text-ink-2")}>{o.openOrders} en cours</span>}
        </>
      )}
      trigger={
        selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full", DOT[selected.availability ?? "online"])} />
            <span className="truncate font-medium">{selected.name}</span>
          </span>
        ) : (
          <span className="text-ink-3">Rechercher un revendeur… ({options.length})</span>
        )
      }
      search={q}
      onSearchChange={setQ}
      onOpenChange={(o) => !o && setQ("")}
      searchLabel="Rechercher un revendeur"
      searchPlaceholder="Nom ou code…"
      emptyText="Aucun revendeur trouvé"
      sheetTitle={label}
    />
  );
}
