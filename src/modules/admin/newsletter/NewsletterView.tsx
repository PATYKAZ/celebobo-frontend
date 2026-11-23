"use client";

import { useState } from "react";
import { SmsNotification } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { Pill } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input } from "@/shared/ui/Form";
import { Pagination } from "@/shared/ui/Pagination";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Skeleton } from "@/shared/ui/Skeleton";
import { api } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../ui/PageHeader";
import { useAdminPage } from "../ui/paged";

interface Subscriber {
  id: number;
  email: string;
  source: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

type Filter = "active" | "inactive" | "all";

function Content() {
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const active = filter === "all" ? undefined : filter === "active";
  const { data, isLoading } = useAdminPage<Subscriber>("newsletter", ENDPOINTS.admin.newsletter.subscribers, { active, search: search.trim() }, page, 50);
  const exportUrl = api.url(ENDPOINTS.admin.newsletter.export, { active, search: search.trim() || undefined });
  return (
    <>
      <PageHeader
        title="Newsletter"
        description="Les adresses inscrites à la newsletter. L'export CSV reprend les filtres choisis."
        actions={<a href={exportUrl} className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary-dark">Exporter en CSV</a>}
      />
      <Block pad="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-6">
          <SegmentedControl size="sm" aria-label="Abonnés" value={filter} onChange={(v) => { setFilter(v); setPage(1); }} options={[{ value: "active", label: "Inscrits" }, { value: "inactive", label: "Désinscrits" }, { value: "all", label: "Tous" }]} />
          <Input aria-label="Rechercher" placeholder="Adresse e-mail…" wrapperClassName="w-full sm:w-64" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {data && <p className="px-4 pt-3 text-[13px] text-ink-3 sm:px-6">{data.meta.count} adresse{data.meta.count > 1 ? "s" : ""}</p>}
        {isLoading || !data ? (
          <Skeleton className="m-4 h-40 rounded-box!" />
        ) : data.results.length === 0 ? (
          <EmptyState icon={<SmsNotification size={40} />} title="Aucune adresse" description="Rien dans cette liste." />
        ) : (
          <ul className="divide-y divide-line-3">
            {data.results.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[13px] sm:px-6">
                <span className="min-w-0 break-all font-semibold">{s.email}</span>
                <span className="flex items-center gap-2 text-ink-3">
                  {s.source && <span>{s.source}</span>}
                  <span>{s.isActive ? `depuis le ${formatDate(s.subscribedAt)}` : `désinscrit le ${formatDate(s.unsubscribedAt ?? s.subscribedAt)}`}</span>
                  {!s.isActive && <Pill tone="gray">Désinscrit</Pill>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {data && <Pagination className="py-4" page={page} pageCount={data.meta.totalPages} onChange={setPage} />}
      </Block>
    </>
  );
}

export function NewsletterView() {
  return (
    <PermissionGuard permission="newsletter.view">
      <Content />
    </PermissionGuard>
  );
}
