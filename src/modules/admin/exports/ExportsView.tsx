"use client";

import { useState } from "react";
import { DocumentDownload } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { Pill } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";
import { jobDownloadUrl, type Job, type JobKind, type JobStatus } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../ui/PageHeader";
import { useAdminPage } from "../ui/paged";

const KIND: Record<JobKind, string> = {
  sales_export: "Export des ventes",
  products_export: "Export du catalogue",
  products_import: "Import du catalogue",
  analytics_report: "Rapport d'analytique",
  personal_data: "Mes données personnelles",
};
const STATUS: Record<JobStatus, { label: string; tone: "yellow" | "green" | "red" }> = {
  pending: { label: "En attente", tone: "yellow" },
  running: { label: "En cours", tone: "yellow" },
  done: { label: "Terminé", tone: "green" },
  failed: { label: "Échec", tone: "red" },
};

const size = (bytes: number) => (bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1000))} Ko`);

function importSummary(job: Job): string | null {
  if (job.kind !== "products_import" || !job.summary) return null;
  const s = job.summary as { created?: number; updated?: number; errors?: unknown[] };
  const parts = [s.created != null && `${s.created} créé(s)`, s.updated != null && `${s.updated} mis à jour`, s.errors?.length ? `${s.errors.length} ligne(s) en erreur` : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function Content() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminPage<Job>("jobs", ENDPOINTS.jobs.list, {}, page);
  const pending = data?.results.some((j) => j.status === "pending" || j.status === "running");
  return (
    <>
      <PageHeader title="Mes exports" description="Vos exports, imports et rapports des 7 derniers jours : retéléchargez un fichier sans relancer l'export." />
      <Block pad="none" className="overflow-hidden">
        {isLoading || !data ? (
          <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : data.results.length === 0 ? (
          <EmptyState icon={<DocumentDownload size={40} />} title="Aucun export" description="Les exports lancés depuis les ventes, le catalogue ou l'analytique apparaissent ici." />
        ) : (
          <ul className="divide-y divide-line-3">
            {data.results.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px] sm:px-6">
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold">{KIND[job.kind] ?? job.kind} <span className="font-normal uppercase text-ink-3">· {job.format}</span></span>
                  <span className="block text-ink-3">
                    {formatDateTime(job.createdAt)}
                    {job.downloadable && job.size ? ` · ${size(job.size)}` : ""}
                    {importSummary(job) ? ` · ${importSummary(job)}` : ""}
                    {job.status === "failed" && job.error ? ` · ${job.error}` : ""}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Pill tone={STATUS[job.status].tone}>{STATUS[job.status].label}</Pill>
                  {job.downloadable && (
                    <a href={jobDownloadUrl(job)} className="inline-flex min-h-10 items-center rounded-full bg-chip px-4 font-semibold text-primary hover:bg-primary hover:text-white">Télécharger</a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {pending && <p className="px-4 pb-3 text-[12px] text-ink-3 sm:px-6">Un export est en cours : rechargez la page dans quelques instants.</p>}
        {data && <Pagination className="py-4" page={page} pageCount={data.meta.totalPages} onChange={setPage} />}
      </Block>
    </>
  );
}

export function ExportsView() {
  return (
    <PermissionGuard permission="jobs.view.own">
      <Content />
    </PermissionGuard>
  );
}
