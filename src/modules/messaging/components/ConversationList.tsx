"use client";

import { AnimatePresence, motion } from "motion/react";
import { Add, Messages2, SearchNormal1 } from "iconsax-reactjs";
import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
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

  return (
    <div className="flex min-h-0 flex-col">
      <div className="space-y-3 border-b border-line-3 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] leading-[28px]">{inbox ? (seeAll ? "Boîte de réception" : "Mes discussions") : "Messages"}</h1>
          {!inbox && (
            <button
              onClick={() => create.mutate(undefined, { onSuccess: (c) => onSelect(c.id) })}
              disabled={create.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[12px] font-bold uppercase text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              <Add size={15} /> Nouvelle
            </button>
          )}
        </div>
        <div className="relative">
          <SearchNormal1 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={inbox ? "Client, n° de commande, revendeur…" : "Rechercher une discussion…"} aria-label="Rechercher" className="field h-10 pl-9" />
        </div>
        {inbox && (
          <>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtres">
              {FILTERS.filter((f) => seeAll || f.value !== "unassigned").map((f) => (
                <button
                  key={f.value}
                  role="tab"
                  aria-selected={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors", filter === f.value ? "bg-primary text-white" : "bg-chip text-ink-2 hover:bg-primary-50 hover:text-primary")}
                >
                  {f.label}
                  <span className={cn("rounded-full px-1.5 text-[11px]", filter === f.value ? "bg-white/25" : "bg-white")}>{counts[f.value]}</span>
                </button>
              ))}
            </div>
            {seeAll && resellers.length > 0 && (
              <select value={reseller} onChange={(e) => setReseller(e.target.value)} aria-label="Filtrer par revendeur" className="field h-10 text-[13px]">
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

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
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
