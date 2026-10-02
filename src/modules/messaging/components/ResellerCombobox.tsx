"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown2, SearchNormal1 } from "iconsax-reactjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/Avatar";
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
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => String(o.id) === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => `${o.name} ${o.code ?? ""}`.toLowerCase().includes(s)) : options;
  }, [options, q]);

  return (
    <div ref={box} className={cn("relative flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-semibold leading-[19.5px]">{label}</span>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} className="field flex items-center justify-between gap-2 text-left">
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full", DOT[selected.availability ?? "online"])} />
            <span className="truncate font-medium">{selected.name}</span>
          </span>
        ) : (
          <span className="text-ink-3">Rechercher un revendeur… ({options.length})</span>
        )}
        <ArrowDown2 size={14} className={cn("shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }} className="absolute left-0 right-0 top-full z-30 mt-1 rounded-box border border-line-3 bg-white p-2 shadow-[0_12px_40px_rgba(0,0,0,.14)]">
            <div className="relative mb-2">
              <SearchNormal1 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou code…" aria-label="Rechercher un revendeur" className="field h-9 pl-9 text-[13px]" />
            </div>
            <ul role="listbox" className="max-h-[240px] overflow-y-auto">
              {list.length === 0 && <li className="px-3 py-4 text-center text-[13px] text-ink-3">Aucun revendeur trouvé</li>}
              {list.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={String(o.id) === value}
                    onClick={() => {
                      onChange(String(o.id));
                      setOpen(false);
                      setQ("");
                    }}
                    className={cn("flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-chip", String(o.id) === value && "bg-primary-50")}
                  >
                    <span className="relative">
                      <Avatar name={o.name} size={30} />
                      <span className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white", DOT[o.availability ?? "online"])} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold leading-[18px]">{o.name}</span>
                      <span className="text-[11px] text-ink-3">{LABEL[o.availability ?? "online"]}{o.code ? ` · code ${o.code}` : ""}</span>
                    </span>
                    {o.openOrders != null && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", o.openOrders > 4 ? "bg-danger-100 text-danger" : "bg-chip text-ink-2")}>{o.openOrders} en cours</span>}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
