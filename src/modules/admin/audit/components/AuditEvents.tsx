"use client";

import { ArrowDown2 } from "@/shared/ui/icons";
import { useState } from "react";
import { ENDPOINTS } from "@/config/endpoints";
import { cn } from "@/shared/lib/cn";
import { formatDateTime, formatRelative } from "@/shared/lib/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useAdminPage } from "../../ui/paged";

/** Événement métier du journal (commande passée, rôle changé, sanction…), tel qu'enregistré par l'API. */
interface AuditEvent {
  id: string;
  eventType: string;
  name: string;
  actor: { id: number; name: string } | null;
  payload: Record<string, unknown> | null;
  occurredAt: string;
}

function EventRow({ e }: { e: AuditEvent }) {
  const [open, setOpen] = useState(false);
  const fields = Object.entries(e.payload ?? {}).filter(([, v]) => v !== null && v !== "");
  return (
    <li className="px-4 py-3 text-[13px] sm:px-6">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} disabled={!fields.length} className="flex w-full items-start justify-between gap-3 text-left disabled:cursor-default">
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold">{e.name || e.eventType}</span>
          <span className="block text-ink-3">
            {e.actor?.name ?? "Système"} · {formatDateTime(e.occurredAt)} · {formatRelative(e.occurredAt)}
          </span>
        </span>
        {fields.length > 0 && <ArrowDown2 size={16} className={cn("mt-1 shrink-0 text-ink-3 transition-transform", open && "rotate-180")} />}
      </button>
      {open && (
        <dl className="mt-2 grid gap-1 rounded-box bg-page/60 p-3 sm:grid-cols-[180px_1fr]">
          {fields.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="font-mono text-[12px] text-ink-3">{key}</dt>
              <dd className="break-all">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

/** Onglet « Événements métier » du journal d'audit (`GET /bo/audit-logs/events/`). */
export function AuditEvents() {
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const eventType = useDebounce(type.trim(), 300);
  const { data, isLoading } = useAdminPage<AuditEvent>("audit-events", ENDPOINTS.admin.audit.events, { eventType, dateFrom: from, dateTo: to }, page);
  const reset = () => { setType(""); setFrom(""); setTo(""); setPage(1); };
  return (
    <Block pad="none" className="overflow-hidden">
      <div className="grid gap-3 p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end sm:p-5 sm:px-[30px]">
        <Input aria-label="Type d'événement" placeholder="Type d'événement (ex. OrderStatusChanged)" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} />
        <Input type="date" aria-label="Du" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <Input type="date" aria-label="Au" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        <Button variant="chip" upper={false} onClick={reset}>Réinitialiser</Button>
      </div>
      {isLoading || !data ? (
        <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : data.results.length === 0 ? (
        <p className="py-14 text-center text-[14px] text-ink-3">Aucun événement ne correspond à ces filtres.</p>
      ) : (
        <ul className="divide-y divide-line-3">{data.results.map((e) => <EventRow key={e.id} e={e} />)}</ul>
      )}
      {data && <Pagination className="py-5" page={page} pageCount={data.meta.totalPages} onChange={setPage} />}
    </Block>
  );
}
