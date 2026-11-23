"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sms } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { Pill } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input, Select } from "@/shared/ui/Form";
import { Pagination } from "@/shared/ui/Pagination";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { api, getErrorMessage } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../ui/PageHeader";
import { useAdminPage } from "../ui/paged";

type Status = "new" | "handled" | "spam";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: Status;
  note: string;
  handledBy: string | null;
  handledAt: string | null;
  createdAt: string;
}

const SUBJECTS: Record<string, string> = { order: "Commande", product: "Produit", reseller: "Devenir revendeur", partnership: "Partenariat", other: "Autre" };
const STATUS: Record<Status, { label: string; tone: "yellow" | "green" | "gray" }> = {
  new: { label: "Nouveau", tone: "yellow" },
  handled: { label: "Traité", tone: "green" },
  spam: { label: "Indésirable", tone: "gray" },
};

function Row({ m }: { m: ContactMessage }) {
  const qc = useQueryClient();
  const [note, setNote] = useState(m.note);
  const update = useMutation({
    mutationFn: (status: Status) => api.patch(ENDPOINTS.admin.contactMessages.detail(m.id), { status, note }),
    onSuccess: (_d, status) => {
      qc.invalidateQueries({ queryKey: ["admin", "contact"] });
      toast.success(status === "handled" ? "Message traité" : status === "spam" ? "Message classé indésirable" : "Message rouvert");
    },
    onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
  });
  return (
    <li className="space-y-2 px-4 py-3.5 text-[13px] sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span><b className="text-[14px]">{m.name}</b> · {SUBJECTS[m.subject] ?? m.subject}</span>
        <Pill tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Pill>
      </div>
      <p className="text-ink-3">
        <a href={`mailto:${m.email}`} className="text-primary hover:underline">{m.email}</a>
        {m.phone && <> · <a href={`tel:${m.phone}`} className="text-primary hover:underline">{m.phone}</a></>} · {formatDateTime(m.createdAt)}
      </p>
      <p className="whitespace-pre-line rounded-box bg-page/70 p-2.5 text-ink-2">{m.message}</p>
      {m.status !== "new" && m.handledAt && <p className="text-ink-3">{STATUS[m.status].label}{m.handledBy ? ` par ${m.handledBy}` : ""} le {formatDateTime(m.handledAt)}{m.note ? ` · ${m.note}` : ""}</p>}
      {m.status === "new" ? (
        <div className="flex flex-wrap gap-2">
          <Input aria-label="Note interne" placeholder="Note interne (facultatif)" wrapperClassName="min-w-0 flex-1" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button size="sm" upper={false} loading={update.isPending && update.variables === "handled"} onClick={() => update.mutate("handled")}>Marquer traité</Button>
          <Button size="sm" variant="ghost" upper={false} loading={update.isPending && update.variables === "spam"} onClick={() => update.mutate("spam")}>Indésirable</Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" upper={false} loading={update.isPending} onClick={() => update.mutate("new")}>Rouvrir</Button>
      )}
    </li>
  );
}

function Content() {
  const [status, setStatus] = useState<Status>("new");
  const [subject, setSubject] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminPage<ContactMessage>("contact", ENDPOINTS.admin.contactMessages.list, { status, subject, search: search.trim() }, page);
  return (
    <>
      <PageHeader title="Messages de contact" description="Les messages envoyés depuis la page Contact. Répondez par e-mail ou téléphone, puis marquez-les traités." />
      <Block pad="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-6">
          <SegmentedControl size="sm" aria-label="Statut" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "new", label: "Nouveaux" }, { value: "handled", label: "Traités" }, { value: "spam", label: "Indésirables" }]} />
          <Select aria-label="Sujet" wrapperClassName="w-48" value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }} options={[{ value: "", label: "Tous les sujets" }, ...Object.entries(SUBJECTS).map(([value, label]) => ({ value, label }))]} />
          <Input aria-label="Rechercher" placeholder="Nom, e-mail, texte…" wrapperClassName="w-full sm:ml-auto sm:w-64" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {isLoading || !data ? (
          <Skeleton className="m-4 h-40 rounded-box!" />
        ) : data.results.length === 0 ? (
          <EmptyState icon={<Sms size={40} />} title="Aucun message" description="Rien dans cette liste." />
        ) : (
          <ul className="divide-y divide-line-3">{data.results.map((m) => <Row key={m.id} m={m} />)}</ul>
        )}
        {data && <Pagination className="py-4" page={page} pageCount={data.meta.totalPages} onChange={setPage} />}
      </Block>
    </>
  );
}

export function ContactInboxView() {
  return (
    <PermissionGuard permission="contact.inbox">
      <Content />
    </PermissionGuard>
  );
}
