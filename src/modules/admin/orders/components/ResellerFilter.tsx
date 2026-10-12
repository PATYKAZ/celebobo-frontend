"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Combobox } from "@/shared/ui/Combobox";
import { useResellerOptions } from "../hooks/useAdminOrders";
import { AvailabilityDot } from "./parts";

/** Sélecteur de revendeur avec recherche (filtre de la liste). */
export function ResellerFilter({ value, onChange }: { value?: number; onChange: (id: number | undefined) => void }) {
  const { data } = useResellerOptions();
  const [q, setQ] = useState("");
  const current = data?.find((r) => r.id === value);
  const list = useMemo(() => (data ?? []).filter((r) => !q || `${r.name} ${r.code}`.toLowerCase().includes(q.toLowerCase())), [data, q]);

  return (
    <Combobox
      ariaLabel="Filtrer par revendeur"
      items={list}
      getKey={(r) => String(r.id)}
      selectedKey={value != null ? String(value) : null}
      onSelect={(r) => onChange(r.id)}
      leading={{ label: "Tous les revendeurs", onSelect: () => onChange(undefined), selected: value == null }}
      renderItem={(r, selected) => (
        <span className={cn("flex w-full items-center justify-between gap-2 text-[13px]", selected && "font-bold text-primary")}>
          <span className="truncate">{r.name}</span>
          <AvailabilityDot value={r.availability} />
        </span>
      )}
      trigger={<span className={cn("truncate font-medium", !current && "text-ink-3")}>{current ? current.name : "Tous les revendeurs"}</span>}
      search={q}
      onSearchChange={setQ}
      onOpenChange={(o) => !o && setQ("")}
      searchLabel="Rechercher un revendeur"
      sheetTitle="Filtrer par revendeur"
      panelClassName="w-[280px]"
    />
  );
}
