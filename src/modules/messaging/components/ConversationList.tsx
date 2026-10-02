"use client";

import { AnimatePresence, motion } from "motion/react";
import { Add, Filter, Messages2, SearchNormal1, TickCircle } from "iconsax-reactjs";
import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { can } from "@/modules/auth/permissions";
import { useConversations, useCreateConversation } from "../hooks/useConversations";
import type { InboxFilter } from "../types";
import { ConversationItem } from "./ConversationItem";

interface Props {
  activeId: number | null;
  onSelect: (id: number) => void;
  /** Vue boîte de réception équipe (filtres + client mis en avant) */
  inbox?: boolean;
}

const FILTERS: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "unassigned", label: "Non assignées" },
  { value: "awaiting", label: "En attente de réponse" },
];

export function ConversationList({ activeId, onSelect, inbox }: Props) {
  const { user } = useAuth();
  const { data, isLoading } = useConversations();
  const create = useCreateConversation();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [reseller, setReseller] = useState("");
  const [filterSheet, setFilterSheet] = useState(false);
  const seeAll = can(user, "inbox.view.all");

  const resellers = useMemo(() => {
    const map = new Map<number, string>();
    data?.forEach((c) => c.assignedRevendeur && map.set(c.assignedRevendeur.id, c.assignedRevendeur.name));
    return [...map].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const counts = useMemo(
    () => ({
      all: data?.length ?? 0,
      unassigned: data?.filter((c) => !c.assignedRevendeur && !c.concluded).length ?? 0,
      awaiting: data?.filter((c) => c.awaitingReply).length ?? 0,
    }),
    [data],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (inbox) {
        if (filter === "unassigned" && (c.assignedRevendeur || c.concluded)) return false;
        if (filter === "awaiting" && !c.awaitingReply) return false;
        if (reseller && String(c.assignedRevendeur?.id ?? "") !== reseller) return false;
      }
      if (!s) return true;
      return `${c.displayName} #${c.relatedOrderId ?? ""} ${c.client?.name ?? ""} ${c.assignedRevendeur?.name ?? ""} ${c.participants.map((p) => p.name).join(" ")} ${c.lastMessage?.content ?? ""}`.toLowerCase().includes(s);
    });
  }, [data, q, filter, reseller, inbox]);

  const resellerName = resellers.find(([id]) => String(id) === reseller)?.[1];

  return (
    <div className="flex min-h-0 flex-col lg:h-full">
      {/* Titre (défile avec la page sur mobile) */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4 lg:pb-3">
        <h1 className="text-[22px] leading-[28px] lg:text-[20px]">{inbox ? (seeAll ? "Boîte de réception" : "Mes discussions") : "Messages"}</h1>
        {!inbox && (
          <button
            onClick={() => create.mutate(undefined, { onSuccess: (c) => onSelect(c.id) })}
            disabled={create.isPending}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-[12px] font-bold uppercase text-white transition-all hover:bg-primary-dark active:scale-95 disabled:opacity-60 lg:h-9 lg:px-3.5"
          >
            <Add size={15} /> Nouvelle
          </button>
        )}
      </div>

      {/* Recherche + filtres : collants sur mobile (toujours à portée de pouce) */}
      <div className="sticky top-0 z-20 space-y-2.5 border-b border-line-3 bg-white/95 px-4 pb-3 pt-2 backdrop-blur lg:static lg:bg-white lg:pt-0">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchNormal1 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={inbox ? "Client, n° de commande, revendeur…" : "Rechercher une discussion…"} aria-label="Rechercher" className="field pl-9 lg:h-10" />
          </div>
          {inbox && seeAll && resellers.length > 0 && (
            <button
              onClick={() => setFilterSheet(true)}
              aria-label="Filtrer par revendeur"
              className={cn("relative grid size-12 shrink-0 place-items-center rounded-box transition-all active:scale-95 lg:hidden", reseller ? "bg-primary text-white" : "bg-chip text-ink")}
            >
              <Filter size={20} variant={reseller ? "Bold" : "Linear"} />
              {reseller && <span className="absolute -right-1 -top-1 size-3 rounded-full bg-danger ring-2 ring-white" />}
            </button>
          )}
        </div>
        {inbox && (
          <>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [mask-image:linear-gradient(90deg,transparent,#000_14px,#000_calc(100%-14px),transparent)] lg:mx-0 lg:flex-wrap lg:gap-1.5 lg:overflow-visible lg:px-0 lg:[mask-image:none]" role="tablist" aria-label="Filtres">
              {FILTERS.filter((f) => seeAll || f.value !== "unassigned").map((f) => (
                <button
                  key={f.value}
                  role="tab"
                  aria-selected={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn("inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-colors active:scale-95 lg:min-h-0 lg:px-3 lg:py-1.5 lg:text-[12px]", filter === f.value ? "bg-primary text-white" : "bg-chip text-ink-2 hover:bg-primary-50 hover:text-primary")}
                >
                  {f.label}
                  <span className={cn("rounded-full px-1.5 text-[11px]", filter === f.value ? "bg-white/25" : "bg-white")}>{counts[f.value]}</span>
                </button>
              ))}
              {resellerName && (
                <button onClick={() => setReseller("")} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary-50 px-4 text-[13px] font-semibold text-primary-dark ring-1 ring-primary/30 active:scale-95 lg:hidden">
                  {resellerName} <span aria-hidden>×</span>
                </button>
              )}
            </div>
            {/* desktop : sélecteur classique */}
            {seeAll && resellers.length > 0 && (
              <select value={reseller} onChange={(e) => setReseller(e.target.value)} aria-label="Filtrer par revendeur" className="field hidden text-[13px] lg:block lg:h-10">
                <option value="">Tous les revendeurs</option>
                {resellers.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* mobile : feuille de filtre revendeur */}
      <BottomSheet open={filterSheet} onClose={() => setFilterSheet(false)} title="Filtrer par revendeur">
        <ul className="space-y-1 pb-2 pt-1">
          {[["", "Tous les revendeurs"] as const, ...resellers.map(([id, name]) => [String(id), name] as const)].map(([id, name]) => (
            <li key={id || "all"}>
              <button
                onClick={() => {
                  setReseller(id);
                  setFilterSheet(false);
                }}
                className={cn("flex min-h-14 w-full items-center justify-between gap-3 rounded-box px-3 text-left text-[15px] font-semibold transition-colors active:bg-chip", reseller === id && "bg-primary-50 text-primary-dark")}
              >
                {name}
                {reseller === id && <TickCircle size={20} variant="Bold" className="text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>

      <div className="min-h-0 flex-1 space-y-1 p-2 pb-4 lg:overflow-y-auto lg:pb-2">
        {isLoading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex gap-3 p-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-3 w-full" /></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Messages2 size={36} variant="Bulk" />} title="Aucune discussion" description={inbox ? "Aucune discussion ne correspond à ces filtres." : "Vos échanges avec les revendeurs apparaîtront ici après une commande."} className="py-10" />
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((c, i) => (
              <motion.div key={c.id} layout initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <ConversationItem conversation={c} active={c.id === activeId} myId={user?.id ?? 0} onSelect={onSelect} staff={inbox} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
