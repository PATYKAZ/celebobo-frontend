"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, Messages2, SearchNormal1, UserAdd, UserTick } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Form";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Tabs } from "@/shared/ui/Tabs";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { ORDER_STATUS_LABEL, type Order } from "@/modules/orders/types";
import { ActiveChips, FilterSheet, FilterTrigger, MobileSearchRow, type FilterChip } from "../../products/components/FilterSheet";
import { DataTable, type Column } from "../../ui/DataTable";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useAdminOrders } from "../hooks/useAdminOrders";
import type { AdminOrderListParams, OrderTab } from "../types";
import { AssignResellerModal } from "./AssignResellerModal";
import { AvailabilityDot, OrderStatusDot, PAYMENT_LABEL, Thumbs } from "./parts";
import { ResellerFilter } from "./ResellerFilter";
import { useResellerOptions } from "../hooks/useAdminOrders";

const PAGE_SIZE = 10;
const STATUS_TABS: OrderTab[] = ["attente", "assignee", "confirmee", "payee", "en_livraison", "livree", "annulee", "retournee"];

export function OrdersView() {
  return (
    <PermissionGuard permission="orders.view.own">
      <OrdersContent />
    </PermissionGuard>
  );
}

function OrdersContent() {
  const router = useRouter();
  const canAll = useCan("orders.view.all");
  const canAssign = useCan("orders.assign");
  const [tab, setTab] = useState<OrderTab>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [resellerId, setResellerId] = useState<number | undefined>();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [assigning, setAssigning] = useState<Order | null>(null);
  const [sheet, setSheet] = useState(false);
  const { data: resellers } = useResellerOptions();
  const q = useDebounce(search, 300);
  const dMin = useDebounce(min, 400);
  const dMax = useDebounce(max, 400);

  const params: AdminOrderListParams = {
    status: tab,
    page,
    pageSize: PAGE_SIZE,
    search: q || undefined,
    resellerId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    minAmount: dMin ? Number(dMin) : undefined,
    maxAmount: dMax ? Number(dMax) : undefined,
  };
  const { data, isLoading, isFetching } = useAdminOrders(params);

  useEffect(() => setPage(1), [tab, q, resellerId, dateFrom, dateTo, dMin, dMax]);

  const counts = data?.counts;
  const tabs = [
    { value: "all" as OrderTab, label: "Toutes", count: counts?.all },
    ...(canAll ? [{ value: "unassigned" as OrderTab, label: "Non assignées", count: counts?.unassigned }] : []),
    ...STATUS_TABS.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s as keyof typeof ORDER_STATUS_LABEL], count: counts?.[s] })),
  ];
  const filtered = !!(search || resellerId || dateFrom || dateTo || min || max);
  const fmtD = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  const chips: FilterChip[] = [
    ...(resellerId ? [{ key: "reseller", label: resellers?.find((r) => r.id === resellerId)?.name ?? "Revendeur", onRemove: () => setResellerId(undefined) }] : []),
    ...(dateFrom || dateTo ? [{ key: "date", label: `${dateFrom ? fmtD(dateFrom) : "…"} → ${dateTo ? fmtD(dateTo) : "…"}`, onRemove: () => { setDateFrom(""); setDateTo(""); } }] : []),
    ...(min || max ? [{ key: "amount", label: `${min ? `≥ ${min}` : ""}${min && max ? " · " : ""}${max ? `≤ ${max}` : ""}`, onRemove: () => { setMin(""); setMax(""); } }] : []),
  ];
  const reset = () => {
    setSearch("");
    setResellerId(undefined);
    setDateFrom("");
    setDateTo("");
    setMin("");
    setMax("");
  };

  const columns: Column<Order>[] = [
    { key: "id", header: "N°", mobile: "hide", cell: (o) => <Link href={ROUTES.admin.order(o.id)} className="font-bold text-primary hover:underline">#{o.id}</Link> },
    {
      key: "client",
      header: "Client",
      mobile: "title",
      cell: (o) => (
        <div className="min-w-0">
          {/* mobile : n° + statut en en-tête de carte */}
          <div className="mb-1 flex items-center justify-between gap-2 sm:hidden">
            <span className="text-[15px] font-bold text-primary">#{o.id}</span>
            <OrderStatusDot status={o.status} />
          </div>
          <p className="truncate font-semibold">{o.user.name}</p>
          <p className="truncate text-[12px] text-ink-3">{o.user.email}</p>
        </div>
      ),
    },
    { key: "items", header: "Articles", hideBelow: "md", cell: (o) => <Thumbs order={o} /> },
    { key: "total", header: "Total", align: "right", cell: (o) => <span className="font-bold">{formatPrice(o.totalPrice)}</span> },
    { key: "status", header: "Statut", mobile: "hide", cell: (o) => <OrderStatusDot status={o.status} /> },
    {
      key: "reseller",
      header: "Revendeur",
      hideBelow: "lg",
      cell: (o) => <ResellerCell order={o} />,
    },
    { key: "pay", header: "Paiement", hideBelow: "xl", mobile: "hide", cell: (o) => <span className="text-[13px] text-ink-2">{o.paymentMethod ? PAYMENT_LABEL[o.paymentMethod] : "—"}</span> },
    { key: "date", header: "Date", hideBelow: "sm", cell: (o) => <span className="whitespace-nowrap text-[13px] text-ink-2">{formatDate(o.createdAt)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (o) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={ROUTES.admin.order(o.id)} aria-label={`Voir la commande #${o.id}`} title="Voir" className="grid size-11 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white active:scale-90 sm:size-8"><Eye size={16} /></Link>
          {canAssign && !["livree", "annulee", "retournee"].includes(o.status) && (
            <button onClick={() => setAssigning(o)} aria-label={o.assignedRevendeur ? "Réassigner" : "Assigner"} title={o.assignedRevendeur ? "Réassigner" : "Assigner"} className="grid size-11 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white active:scale-90 sm:size-8">
              {o.assignedRevendeur ? <UserTick size={16} /> : <UserAdd size={16} />}
            </button>
          )}
          {o.conversationId != null && (
            <Link href={ROUTES.admin.conversation(o.conversationId)} aria-label="Ouvrir la discussion" title="Discussion" className="grid size-11 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white active:scale-90 sm:size-8"><Messages2 size={16} /></Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={canAll ? "Commandes & discussions" : "Mes commandes"} description={canAll ? "Suivez, assignez et faites avancer les commandes clients." : "Les commandes qui vous sont assignées."} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
        {canAll && <StatCard label="À assigner" value={data?.kpis.toAssign ?? 0} icon={<UserAdd size={22} variant="Bold" />} tone="orange" />}
        <StatCard label="En cours" value={data?.kpis.inProgress ?? 0} icon={<Messages2 size={22} variant="Bold" />} tone="blue" delay={0.05} />
        <StatCard label={`Livrées — ${data?.kpis.periodLabel ?? "ce mois"}`} value={data?.kpis.deliveredThisMonth ?? 0} icon={<UserTick size={22} variant="Bold" />} tone="green" delay={0.1} />
      </div>

      <Block pad="none">
        <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
          <Tabs variant="pill" tabs={tabs} value={tab} onChange={setTab} />

          {/* Mobile : recherche + « Filtrer » (feuille) + pastilles */}
          <div className="space-y-3 sm:hidden">
            <MobileSearchRow>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Client, e-mail, n°…" aria-label="Rechercher" inputMode="search" className="field min-w-0 flex-1" />
              <FilterTrigger count={chips.length} onClick={() => setSheet(true)} />
            </MobileSearchRow>
            <ActiveChips chips={chips} />
          </div>
          <FilterSheet open={sheet} onClose={() => setSheet(false)} title="Filtrer les commandes" onReset={reset} resetDisabled={!filtered}>
            {canAll && <Select label="Revendeur" value={resellerId ?? ""} onChange={(e) => setResellerId(e.target.value ? Number(e.target.value) : undefined)} options={[{ value: "", label: "Tous les revendeurs" }, ...(resellers ?? []).map((r) => ({ value: r.id, label: r.name }))]} />}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Du" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input label="Au" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Montant min ($)" type="number" inputMode="decimal" min={0} value={min} onChange={(e) => setMin(e.target.value)} />
              <Input label="Montant max ($)" type="number" inputMode="decimal" min={0} value={max} onChange={(e) => setMax(e.target.value)} />
            </div>
          </FilterSheet>

          {/* Desktop / tablette */}
          <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-6">
            <Input wrapperClassName="lg:col-span-2" placeholder="Client, e-mail ou n° de commande…" value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<SearchNormal1 size={16} />} aria-label="Rechercher" />
            {canAll && <div className="lg:col-span-1"><ResellerFilter value={resellerId} onChange={setResellerId} /></div>}
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="Du" title="Du" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="Au" title="Au" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" min={0} placeholder="Min $" value={min} onChange={(e) => setMin(e.target.value)} aria-label="Montant minimum" />
              <Input type="number" min={0} placeholder="Max $" value={max} onChange={(e) => setMax(e.target.value)} aria-label="Montant maximum" />
            </div>
          </div>
          {filtered && (
            <div className="flex items-center justify-between rounded-md bg-primary-50 px-3 py-2 text-[13px]">
              <span>{data?.count ?? 0} résultat(s) avec les filtres actifs</span>
              <Button size="xs" variant="ghost" upper={false} onClick={reset}>Réinitialiser</Button>
            </div>
          )}
        </div>

        <div className={isFetching && !isLoading ? "opacity-70 transition-opacity" : "transition-opacity"}>
          <DataTable
            columns={columns}
            rows={data?.results}
            rowKey={(o) => o.id}
            onRowClick={(o) => router.push(ROUTES.admin.order(o.id))}
            loading={isLoading}
            skeletonRows={PAGE_SIZE}
            page={page}
            pageCount={data ? Math.ceil(data.count / PAGE_SIZE) : 1}
            onPageChange={setPage}
            empty={<EmptyState icon={<Messages2 size={40} />} title="Aucune commande" description={filtered ? "Aucune commande ne correspond à ces filtres." : "Les nouvelles commandes apparaîtront ici."} action={filtered ? <Button size="sm" upper={false} onClick={reset}>Réinitialiser les filtres</Button> : undefined} />}
          />
        </div>
      </Block>

      <AssignResellerModal order={assigning} onClose={() => setAssigning(null)} />
    </>
  );
}

function ResellerCell({ order }: { order: Order }) {
  const { data } = useResellerOptions();
  if (!order.assignedRevendeur) return <span className="text-[13px] text-ink-3">Non assignée</span>;
  const av = data?.find((r) => r.id === order.assignedRevendeur!.id)?.availability;
  return (
    <span className="flex items-center gap-2 text-[13px] font-semibold">
      {av && <AvailabilityDot value={av} />}
      <span className="truncate">{order.assignedRevendeur.name}</span>
    </span>
  );
}
