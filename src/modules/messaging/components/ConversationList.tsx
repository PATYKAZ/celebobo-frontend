"use client";

import { AnimatePresence, motion } from "motion/react";
import { Add, Messages2, SearchNormal1 } from "iconsax-reactjs";
import { useMemo, useState } from "react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useConversations, useCreateConversation } from "../hooks/useConversations";
import { ConversationItem } from "./ConversationItem";

interface Props {
  activeId: number | null;
  onSelect: (id: number) => void;
}

export function ConversationList({ activeId, onSelect }: Props) {
  const { user } = useAuth();
  const { data, isLoading } = useConversations();
  const create = useCreateConversation();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data ?? [];
    return (data ?? []).filter((c) => `${c.displayName} ${c.participants.map((p) => p.name).join(" ")} ${c.lastMessage?.content ?? ""}`.toLowerCase().includes(s));
  }, [data, q]);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="space-y-3 border-b border-line-3 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] leading-[28px]">Messages</h1>
          <button
            onClick={() => create.mutate(undefined, { onSuccess: (c) => onSelect(c.id) })}
            disabled={create.isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[12px] font-bold uppercase text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            <Add size={15} /> Nouvelle
          </button>
        </div>
        <div className="relative">
          <SearchNormal1 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une discussion…" aria-label="Rechercher" className="field h-10 pl-9" />
        </div>
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
          <EmptyState icon={<Messages2 size={36} variant="Bulk" />} title="Aucune discussion" description="Vos échanges avec les revendeurs apparaîtront ici après une commande." className="py-10" />
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((c, i) => (
              <motion.div key={c.id} layout initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <ConversationItem conversation={c} active={c.id === activeId} myId={user?.id ?? 0} onSelect={onSelect} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
