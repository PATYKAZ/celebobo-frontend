"use client";

import { Gallery, Receipt2 } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatRelative } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import type { Conversation } from "../types";

interface Props {
  conversation: Conversation;
  active: boolean;
  myId: number;
  onSelect: (id: number) => void;
}

export function ConversationItem({ conversation: c, active, myId, onSelect }: Props) {
  const others = c.participants.filter((p) => p.id !== myId);
  const lead = others.find((p) => p.role === "revendeur") ?? others[0];
  const last = c.lastMessage;
  const unread = c.unreadCount > 0;
  return (
    <button
      onClick={() => onSelect(c.id)}
      aria-current={active}
      className={cn("relative flex w-full items-start gap-3 rounded-box px-3 py-3 text-left transition-colors", active ? "bg-primary-50" : "hover:bg-chip")}
    >
      {active && <span className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-primary" />}
      <Avatar src={lead?.avatar} name={lead?.name ?? "Celebobo"} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-[14px] leading-[20px]", unread ? "font-extrabold" : "font-bold")}>{lead?.name ?? "Équipe Celebobo"}</span>
          {last && <span className={cn("shrink-0 text-[11px]", unread ? "font-bold text-primary" : "text-ink-3")}>{formatRelative(last.timestamp)}</span>}
        </div>
        <p className={cn("mt-0.5 flex items-center gap-1 truncate text-[13px] leading-[19px]", unread ? "font-semibold text-ink" : "text-ink-2")}>
          {last?.image && !last.content && <Gallery size={13} />}
          <span className="truncate">{last ? (last.content ? last.content.replace(/\n+/g, " ") : "Image") : "Aucun message"}</span>
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          {c.relatedOrderId ? (
            <span className="inline-flex items-center gap-1 rounded bg-chip px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-2"><Receipt2 size={11} variant="Bold" /> Commande #{c.relatedOrderId}</span>
          ) : (
            <span className="rounded bg-chip px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-2">Support</span>
          )}
          {c.concluded && <span className="rounded bg-ink-dark/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-dark">Clôturée</span>}
        </div>
      </div>
      {unread && <span className="mt-1 grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-5 text-white">{c.unreadCount}</span>}
    </button>
  );
}
