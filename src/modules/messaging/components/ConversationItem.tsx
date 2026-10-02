"use client";

import { Gallery, Receipt2 } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatRelative } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import type { Availability, Conversation } from "../types";

interface Props {
  conversation: Conversation;
  active: boolean;
  myId: number;
  onSelect: (id: number) => void;
  /** Vue équipe : le client est mis en avant, tags « non assignée » / « en attente de réponse » */
  staff?: boolean;
}

const DOT: Record<Availability, string> = { online: "bg-primary", away: "bg-star", offline: "bg-ink-3" };

export function ConversationItem({ conversation: c, active, myId, onSelect, staff }: Props) {
  const others = c.participants.filter((p) => p.id !== myId && p.role !== "system");
  const client = others.find((p) => p.role === "client");
  const reseller = others.find((p) => p.role === "revendeur");
  const lead = staff ? client ?? others[0] : reseller ?? others[0];
  const presence = lead?.role === "client" ? undefined : lead?.availability ?? (lead ? "online" : undefined);
  const last = c.lastMessage;
  const unread = c.unreadCount > 0;
  const unassigned = !c.assignedRevendeur && !c.concluded;
  return (
    <button
      onClick={() => onSelect(c.id)}
      aria-current={active}
      className={cn("relative flex min-h-[76px] w-full items-start gap-3 rounded-box px-3 py-3 text-left transition-all active:scale-[0.985] active:bg-chip", active ? "bg-primary-50" : "hover:bg-chip")}
    >
      {active && <span className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-primary" />}
      <span className="relative shrink-0">
        <Avatar src={lead?.avatar} name={lead?.name ?? "Celebobo"} size={48} />
        {presence && !c.concluded && <span className={cn("absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full ring-2 ring-white", DOT[presence])} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-[15px] leading-[20px] lg:text-[14px]", unread ? "font-extrabold" : "font-bold")}>{lead?.name ?? "Équipe Celebobo"}</span>
          {last && <span className={cn("shrink-0 text-[11px]", unread ? "font-bold text-primary" : "text-ink-3")}>{formatRelative(last.timestamp)}</span>}
        </div>
        <p className={cn("mt-0.5 flex items-center gap-1 truncate text-[13px] leading-[19px]", unread ? "font-semibold text-ink" : "text-ink-2")}>
          {last?.image && !last.content && <Gallery size={13} />}
          <span className="truncate">{last ? (last.content ? last.content.replace(/\n+/g, " ") : "Image") : "Aucun message"}</span>
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {c.relatedOrderId ? (
            <span className="inline-flex items-center gap-1 rounded bg-chip px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-2"><Receipt2 size={11} variant="Bold" /> Commande #{c.relatedOrderId}</span>
          ) : (
            <span className="rounded bg-chip px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-2">Support</span>
          )}
          {c.concluded && <span className="rounded bg-ink-dark/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-dark">Clôturée</span>}
          {staff && unassigned && <span className="rounded bg-danger-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-danger">Non assignée</span>}
          {staff && c.assignedRevendeur && <span className="truncate rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-dark">{c.assignedRevendeur.name}</span>}
          {staff && c.awaitingReply && <span className="rounded bg-star/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#b87400]">Réponse attendue</span>}
        </div>
      </div>
      {unread && <span className="mt-1 grid min-w-6 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[12px] font-bold leading-6 text-white">{c.unreadCount}</span>}
    </button>
  );
}
