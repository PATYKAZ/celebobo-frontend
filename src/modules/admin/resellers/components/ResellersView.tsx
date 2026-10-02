"use client";

import { Copy, Crown, People, SearchNormal1, UserAdd } from "iconsax-reactjs";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { StatusDot } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { toast } from "@/shared/ui/Toast";
import { Can, PermissionGuard } from "@/modules/auth/hooks/useCan";
import { DataTable, type Column } from "../../ui/DataTable";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { PERIOD_OPTIONS, type PeriodKey } from "../../dashboard/lib/stats";
import { useResellers } from "../hooks/useResellers";
import { AVAILABILITY_DOT, AVAILABILITY_LABEL, type Reseller, type ResellerOrdering } from "../types";
import { CreateResellerModal } from "./CreateResellerModal";
import { ResellerDrawer } from "./ResellerDrawer";

const PAGE_SIZE = 8;

const ORDERINGS: { value: ResellerOrdering; label: string }[] = [
  { value: "-sales", label: "Plus de ventes" },
  { value: "-invited", label: "Plus d'invités" },
  { value: "-joined", label: "Plus récents" },
  { value: "joined", label: "Plus anciens" },
  { value: "name", label: "Nom (A → Z)" },
];

const STATUSES = [
  { value: "all", label: "Tous" },
  { value: "actif", label: "Actifs" },
  { value: "inactif", label: "Désactivés" },
] as const;

function CopyCode({ code }: { code: string }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(code).then(() => toast.success("Code copié", code), () => toast.error("Copie impossible"));
      }}
      aria-label={`Copier le code ${code}`}
      className="group inline-flex items-center gap-1.5 rounded-md bg-chip px-2.5 py-1 text-[13px] font-bold tracking-widest transition-colors hover:bg-primary hover:text-white max-md:min-h-10 max-md:px-3"
    >
      {code}
      <Copy size={14} className="transition-transform group-hover:scale-110" />
    </button>
  );
}

export function ResellersView() {
  return (
    <PermissionGuard permission="resellers.view">
      <ResellersContent />
    </PermissionGuard>
  );
}

function ResellersContent() {
  const sp = useSearchParams();
  const initialPeriod = (["7d", "30d", "12m"].includes(sp.get("period") ?? "") ? sp.get("period") : "30d") as PeriodKey;
  const [period, setPeriod] = useState<PeriodKey>(initialPeriod);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<ResellerOrdering>("-sales");
  const [status, setStatus] = useState<"all" | "actif" | "inactif">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const debounced = useDebounce(search, 300);
  const { data, isLoading } = useResellers({ search: debounced, ordering, status, period, page, pageSize: PAGE_SIZE });

  const columns: Column<Reseller>[] = [
    {
      key: "name",
      header: "Revendeur",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="relative">
            <Avatar src={r.avatar} name={r.name} size={38} />
            <span title={AVAILABILITY_LABEL[r.availability]} className={cn("absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-white", AVAILABILITY_DOT[r.availability])} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-[18px]">{r.name}</p>
            <p className="truncate text-[12px] text-ink-3">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "code", header: "Code", hideBelow: "sm", cell: (r) => <CopyCode code={r.codeRevendeur} /> },
    { key: "invited", header: "Invités", align: "center", cell: (r) => <strong>{r.invitedCount}</strong> },
    { key: "rate", header: "Commission", hideBelow: "lg", align: "center", cell: (r) => <span className="text-ink-2">{(r.commissionRate * 100).toFixed(1)}%</span> },
    { key: "sales", header: "Ventes générées", hideBelow: "md", align: "right", cell: (r) => <strong>{formatPrice(r.salesTotal)}</strong> },
    { key: "conv", header: "Conversion", hideBelow: "xl", mobile: "hide", align: "center", cell: (r) => <span className="text-ink-2">{r.conversionRate.toFixed(0)}%</span> },
    { key: "joined", header: "Inscrit le", hideBelow: "xl", mobile: "hide", cell: (r) => <span className="text-ink-2">{formatDate(r.joinedAt)}</span> },
    { key: "status", header: "Statut", hideBelow: "md", cell: (r) => <StatusDot tone={r.status === "actif" ? "green" : "gray"}>{r.status === "actif" ? "Actif" : "Désactivé"}</StatusDot> },
  ];

  const stats = data?.stats;
  return (
    <>
      <PageHeader
        title="Revendeurs"
        description={data ? `Classement et chiffres sur : ${data.periodLabel}` : "Suivez vos revendeurs, leurs codes d'invitation et les clients qu'ils ont amenés."}
        actions={
          <Can permission="resellers.manage">
            <Button leftIcon={<UserAdd size={18} />} onClick={() => setCreating(true)}>Nouveau revendeur</Button>
          </Can>
        }
      >
        <Tabs variant="pill" tabs={PERIOD_OPTIONS} value={period} onChange={(p) => { setPeriod(p); setPage(1); }} />
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
        {stats ? (
          <>
            <StatCard label={`Revendeurs (${stats.active} actifs)`} value={stats.total} icon={<People size={22} variant="Bold" />} />
            <StatCard label="Clients invités (total)" value={stats.invited} icon={<UserAdd size={22} variant="Bold" />} tone="blue" delay={0.05} />
            <StatCard label={`Meilleur revendeur : ${stats.topName ?? "—"}`} value={stats.topSales} format={formatPrice} icon={<Crown size={22} variant="Bold" />} tone="orange" delay={0.1} />
          </>
        ) : (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[112px] rounded-box" />)
        )}
      </section>

      <Block pad="none">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:p-5 sm:px-[30px]">
          <Input wrapperClassName="sm:min-w-[240px] sm:flex-1" placeholder="Rechercher un nom, e-mail ou code…" aria-label="Rechercher" leftIcon={<SearchNormal1 size={16} />} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Select wrapperClassName="sm:w-[190px]" aria-label="Trier par" value={ordering} onChange={(e) => { setOrdering(e.target.value as ResellerOrdering); setPage(1); }} options={ORDERINGS} />
          <Tabs variant="pill" tabs={STATUSES.map((s) => ({ value: s.value, label: s.label }))} value={status} onChange={(s) => { setStatus(s); setPage(1); }} />
        </div>
        <DataTable
          columns={columns}
          rows={data?.results}
          loading={isLoading}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSelected(r.id)}
          page={page}
          pageCount={data ? Math.ceil(data.count / PAGE_SIZE) : 1}
          onPageChange={setPage}
          skeletonRows={PAGE_SIZE}
          empty={<p className="py-14 text-center text-[14px] text-ink-3">Aucun revendeur ne correspond à votre recherche.</p>}
        />
      </Block>

      <ResellerDrawer id={selected} period={period} onClose={() => setSelected(null)} />
      <CreateResellerModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
