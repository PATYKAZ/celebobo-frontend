"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { UserAdd } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { Pill } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input, Textarea } from "@/shared/ui/Form";
import { Pagination } from "@/shared/ui/Pagination";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { api, getErrorMessage } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../ui/PageHeader";
import { useAdminPage } from "../ui/paged";

type Status = "pending" | "approved" | "rejected";

interface Application {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  city: string;
  message: string;
  status: Status;
  reviewedBy: { id: number; name: string } | null;
  reviewedAt: string | null;
  decisionNote: string;
  createdAt: string;
}

const STATUS: Record<Status, { label: string; tone: "yellow" | "green" | "gray" }> = {
  pending: { label: "À examiner", tone: "yellow" },
  approved: { label: "Acceptée", tone: "green" },
  rejected: { label: "Refusée", tone: "gray" },
};

function Row({ a }: { a: Application }) {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const done = (title: string) => {
    qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    toast.success(title);
  };
  const approve = useMutation({
    mutationFn: () => api.post(ENDPOINTS.admin.applications.approve(a.id), {}),
    onSuccess: () => done("Candidature acceptée : le compte revendeur est créé"),
    onError: (e) => toast.error("Acceptation impossible", getErrorMessage(e)),
  });
  const reject = useMutation({
    mutationFn: () => api.post(ENDPOINTS.admin.applications.reject(a.id), { reason }),
    onSuccess: () => done("Candidature refusée"),
    onError: (e) => toast.error("Refus impossible", getErrorMessage(e)),
  });
  return (
    <li className="space-y-2 px-4 py-3.5 text-sm sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span><b className="text-sm">{a.firstName} {a.lastName}</b> · {a.city}</span>
        <Pill tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Pill>
      </div>
      <p className="text-ink-3">{a.email} · {a.phoneNumber} · reçue le {formatDateTime(a.createdAt)}</p>
      {a.message && <p className="whitespace-pre-line rounded-box bg-page/70 p-2.5 text-ink-2">{a.message}</p>}
      {a.status !== "pending" && (
        <p className="text-ink-3">{STATUS[a.status].label}{a.reviewedBy ? ` par ${a.reviewedBy.name}` : ""}{a.reviewedAt ? ` le ${formatDateTime(a.reviewedAt)}` : ""}{a.decisionNote ? ` · ${a.decisionNote}` : ""}</p>
      )}
      {a.status === "pending" && (
        <div className="space-y-2">
          {rejecting && <Textarea aria-label="Motif du refus" placeholder="Motif du refus, envoyé au candidat" value={reason} onChange={(e) => setReason(e.target.value)} />}
          <div className="flex flex-wrap gap-2">
            {!rejecting && <Button size="sm" upper={false} loading={approve.isPending} onClick={() => approve.mutate()}>Accepter</Button>}
            {rejecting ? (
              <>
                <Button size="sm" variant="danger" upper={false} disabled={!reason.trim()} loading={reject.isPending} onClick={() => reject.mutate()}>Confirmer le refus</Button>
                <Button size="sm" variant="ghost" upper={false} onClick={() => setRejecting(false)}>Annuler</Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" upper={false} onClick={() => setRejecting(true)}>Refuser</Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function Content() {
  const [status, setStatus] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminPage<Application>("applications", ENDPOINTS.admin.applications.list, { status, search: search.trim() }, page);
  return (
    <>
      <PageHeader title="Candidatures revendeur" description="Les demandes du formulaire « Devenir revendeur » : accepter crée le compte revendeur, refuser prévient le candidat." />
      <Block pad="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-6">
          <SegmentedControl size="sm" aria-label="Statut" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "pending", label: "À examiner" }, { value: "approved", label: "Acceptées" }, { value: "rejected", label: "Refusées" }]} />
          <Input aria-label="Rechercher" placeholder="Nom, e-mail, ville…" wrapperClassName="w-full sm:w-64" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {isLoading || !data ? (
          <Skeleton className="m-4 h-40 rounded-box!" />
        ) : data.results.length === 0 ? (
          <EmptyState icon={<UserAdd size={40} />} title="Aucune candidature" description="Rien dans cette liste." />
        ) : (
          <ul className="divide-y divide-line-3">{data.results.map((a) => <Row key={a.id} a={a} />)}</ul>
        )}
        {data && <Pagination className="py-4" page={page} pageCount={data.meta.totalPages} onChange={setPage} />}
      </Block>
    </>
  );
}

export function ApplicationsView() {
  return (
    <PermissionGuard permission="reseller_applications.review">
      <Content />
    </PermissionGuard>
  );
}
