"use client";

import { ArrowDown2, SearchNormal1 } from "iconsax-reactjs";
import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Popover } from "@/shared/ui/Popover";
import { useResellerOptions } from "../hooks/useAdminOrders";
import { AvailabilityDot } from "./parts";

/** Sélecteur de revendeur avec recherche (filtre de la liste). */
export function ResellerFilter({ value, onChange }: { value?: number; onChange: (id: number | undefined) => void }) {
  const { data } = useResellerOptions();
  const [q, setQ] = useState("");
  const current = data?.find((r) => r.id === value);
  const list = useMemo(() => (data ?? []).filter((r) => !q || `${r.name} ${r.code}`.toLowerCase().includes(q.toLowerCase())), [data, q]);

  return (
    <Popover
      panelClassName="w-[280px]"
      triggerClassName={cn("field flex items-center justify-between gap-2 text-left font-medium", !current && "text-ink-3")}
      trigger={
        <>
          <span className="truncate">{current ? current.name : "Tous les revendeurs"}</span>
          <ArrowDown2 size={14} className="shrink-0" />
        </>
      }
    >
      {(close) => (
        <div>
          <div className="relative mb-2">
            <SearchNormal1 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-full rounded-md border border-line bg-white pl-8 pr-2 text-[13px] outline-none focus:border-primary" />
          </div>
          <ul className="max-h-[240px] overflow-y-auto">
            <li>
              <button onClick={() => { onChange(undefined); close(); }} className="w-full rounded-md px-3 py-2 text-left text-[13px] font-semibold hover:bg-chip">Tous les revendeurs</button>
            </li>
            {list.map((r) => (
              <li key={r.id}>
                <button onClick={() => { onChange(r.id); close(); }} className={cn("flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[13px] hover:bg-chip", r.id === value && "bg-primary-50 font-bold text-primary")}>
                  <span className="truncate">{r.name}</span>
                  <AvailabilityDot value={r.availability} />
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="px-3 py-4 text-center text-[12px] text-ink-3">Aucun résultat</li>}
          </ul>
        </div>
      )}
    </Popover>
  );
}
