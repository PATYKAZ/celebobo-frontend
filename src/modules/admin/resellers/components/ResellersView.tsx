"use client";

import { Copy, Crown, People, SearchNormal1, UserAdd } from "iconsax-reactjs";
import { useState } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { StatusDot } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Input, Select } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { DataTable, type Column } from "../../ui/DataTable";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useResellers } from "../hooks/useResellers";
import type { Reseller, ResellerOrdering } from "../types";
import { ResellerDrawer } from "./ResellerDrawer";

const PAGE_SIZE = 8;

const ORDERINGS: { value: ResellerOrdering; label: string }[] = [
  { value: "-joined", label: "Plus récents" },
  { value: "joined", label: "Plus anciens" },
  { value: "-invited", label: "Plus d'invités" },
  { value: "-sales", label: "Plus de ventes" },
  { value: "name", label: "Nom (A → Z)" },
];

function CopyCode({ code }: { code: string }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(code).then(() => toast.success("Code copié", code), () => toast.error("Copie impossible"));
      }}
      aria-label={`Copier le code ${code}`}
      className="group inline-flex items-center gap-1.5 rounded-md bg-chip px-2.5 py-1 text-[13px] font-bold tracking-widest transition-colors hover:bg-primary hover:text-white"
    >
      {code}
      <Copy size={14} className="transition-transform group-hover:scale-110" />
    </button>
  );
}

export function ResellersView() {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<ResellerOrdering>("-joined");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Reseller | null>(null);
  const debounced = useDebounce(search, 300);
  const { data, isLoading } = useResellers({ search: debounced, ordering, page, pageSize: PAGE_SIZE });

  const columns: Column<Reseller>[] = [
    {
      key: "name",
      header: "Revendeur",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar src={r.avatar} name={r.name} size={38} />
          <div className="min-w-0">
            <p className="truncate font-semibold leading-[18px]">{r.name}</p>
            <p className="truncate text-[12px] text-ink-3">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "code", header: "Code", hideBelow: "sm", cell: (r) => <CopyCode code={r.codeRevendeur} /> },
    { key: "invited", header: "Invités", align: "center", cell: (r) => <strong>{r.invitedCount}</strong> },
    { key: "sales", header: "Ventes générées", hideBelow: "md", align: "right", cell: (r) => <strong>{formatPrice(r.salesTotal)}</strong> },
    { key: "joined", header: "Inscrit le", hideBelow: "lg", cell: (r) => <span className="text-ink-2">{formatDate(r.joinedAt)}</span> },
    { key: "status", header: "Statut", hideBelow: "md", cell: (r) => <StatusDot tone={r.status === "actif" ? "green" : "gray"}>{r.status === "actif" ? "Actif" : "Inactif"}</StatusDot> },
  ];

  const stats = data?.stats;
  return (
    <>
      <PageHeader title="Revendeurs" description="Suivez vos revendeurs, leurs codes d'invitation et les clients qu'ils ont amenés." />

      <section className="grid gap-4 sm:grid-cols-3">
        {stats ? (
          <>
            <StatCard label="Revendeurs" value={stats.total} icon={<People size={22} variant="Bold" />} />
            <StatCard label="Clients invités" value={stats.invited} icon={<UserAdd size={22} variant="Bold" />} tone="blue" delay={0.05} />
            <StatCard label={`Meilleur : ${stats.topName ?? "—"}`} value={stats.topSales} format={formatPrice} icon={<Crown size={22} variant="Bold" />} tone="orange" delay={0.1} />
          </>
        ) : (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[112px] rounded-box" />)
        )}
      </section>

      <Block pad="none">
        <div className="flex flex-wrap items-end gap-4 p-5 sm:px-[30px]">
          <Input wrapperClassName="min-w-[240px] flex-1" placeholder="Rechercher un nom, e-mail ou code…" aria-label="Rechercher" leftIcon={<SearchNormal1 size={16} />} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Select wrapperClassName="w-[200px]" aria-label="Trier par" value={ordering} onChange={(e) => { setOrdering(e.target.value as ResellerOrdering); setPage(1); }} options={ORDERINGS} />
        </div>
        <DataTable
          columns={columns}
          rows={data?.results}
          loading={isLoading}
          rowKey={(r) => r.id}
          onRowClick={setSelected}
          page={page}
          pageCount={data ? Math.ceil(data.count / PAGE_SIZE) : 1}
          onPageChange={setPage}
          skeletonRows={PAGE_SIZE}
          empty={<p className="py-14 text-center text-[14px] text-ink-3">Aucun revendeur ne correspond à « {debounced} ».</p>}
        />
      </Block>

      <ResellerDrawer reseller={selected} onClose={() => setSelected(null)} />
    </>
  );
}
