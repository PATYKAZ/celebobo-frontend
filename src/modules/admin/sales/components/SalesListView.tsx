"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Add, Chart2, DocumentDownload, Edit2, Eye, MoneyRecive, ReceiptItem, Refresh2, Trash, Wallet3 } from "iconsax-reactjs";
import { env } from "@/config/env";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDateTime, formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { StatusDot } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Select } from "@/shared/ui/Form";
import { Tabs } from "@/shared/ui/Tabs";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { DataTable, type Column } from "../../ui/DataTable";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useDeleteSale, useSales, useSellers } from "../hooks/useSales";
import { salesCsv, salesService } from "../services/sales.service";
import { METHOD_STYLE, PRESET_LABEL, SALE_STATUS_LABEL, type PaymentMethod, type Sale, type SaleListParams, type SaleStatus } from "../types";
import { ActiveChips, FilterSheet, FilterTrigger, MobileSearchRow, type FilterChip } from "../../products/components/FilterSheet";
import { MethodBadge } from "./MethodBadge";
import { RefundDialog } from "./RefundDialog";
import { SaleDetailDrawer } from "./SaleDetailDrawer";

const PAGE_SIZE = 10;
const METHODS = Object.keys(METHOD_STYLE) as PaymentMethod[];
const PRESETS: NonNullable<SaleListParams["preset"]>[] = ["", "2", "7", "30", "90"];

export { MethodBadge };

const chip = (on: boolean) => cn("min-h-10 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all active:scale-95 sm:min-h-0 sm:px-3.5 sm:text-[12px]", on ? "border-primary bg-primary text-white" : "border-line bg-white hover:border-primary hover:text-primary");

function SalesListContent() {
  const { user } = useAuth();
  const isReseller = user?.role === "revendeur";
  const canAll = useCan("sales.view.all");
  const canCreate = useCan("sales.create");
  const canConvert = useCan("sales.convert");
  const canExport = useCan("sales.export");
  const canEditAll = useCan("sales.edit.all");
  const canEditOwn = useCan("sales.edit.own");
  const canRefund = useCan("sales.refund");
  const canDelete = useCan("sales.delete");

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [status, setStatus] = useState<SaleStatus | "">("");
  const [preset, setPreset] = useState<NonNullable<SaleListParams["preset"]>>("");
  const [custom, setCustom] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [recordedOn, setRecordedOn] = useState("");
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [view, setView] = useState<"all" | "revendeur">("all");
  const [page, setPage] = useState(1);
  const [sheet, setSheet] = useState(false);
  const q = useDebounce(search, 300);

  const params: SaleListParams = { search: q, method, status, preset: custom ? "" : preset, dateFrom: custom ? dateFrom : "", dateTo: custom ? dateTo : "", recordedOn: custom ? recordedOn : "", sellerId, view, page, pageSize: PAGE_SIZE };
  const { data, isLoading } = useSales(params);
  const { data: sellers } = useSellers(canAll);
  const remove = useDeleteSale();
  const [toDelete, setToDelete] = useState<Sale | null>(null);
  const [toRefund, setToRefund] = useState<Sale | null>(null);
  const [detail, setDetail] = useState<Sale | null>(null);
  const stats = data?.stats;
  const short = custom ? "période perso." : PRESET_LABEL[preset].toLowerCase();

  const sellerName = (sellers ?? []).find((x) => x.id === sellerId)?.name;
  const chips: FilterChip[] = [
    ...(custom
      ? [{ key: "custom", label: "Période perso.", onRemove: () => { setCustom(false); setDateFrom(""); setDateTo(""); setRecordedOn(""); setPage(1); } }]
      : preset
        ? [{ key: "preset", label: `${preset} j`, onRemove: () => { setPreset(""); setPage(1); } }]
        : []),
    ...(method ? [{ key: "method", label: METHOD_STYLE[method].label, onRemove: () => { setMethod(""); setPage(1); } }] : []),
    ...(status ? [{ key: "status", label: SALE_STATUS_LABEL[status], onRemove: () => { setStatus(""); setPage(1); } }] : []),
    ...(sellerId != null ? [{ key: "seller", label: sellerName ?? "Vendeur", onRemove: () => { setSellerId(null); setPage(1); } }] : []),
  ];
  const resetAll = () => {
    setMethod(""); setStatus(""); setPreset(""); setCustom(false); setDateFrom(""); setDateTo(""); setRecordedOn(""); setSellerId(null); setSearch(""); setPage(1);
  };

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };
  const editable = (s: Sale) => s.status === "valide" && (canEditAll || (canEditOwn && s.seller?.id === user?.id));

  const exportCsv = async () => {
    try {
      const rows = await salesService.listAll({ ...params, page: 1 });
      const url = URL.createObjectURL(new Blob([salesCsv(rows)], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `ventes-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export CSV prêt", `${rows.length} ligne${rows.length > 1 ? "s" : ""}`);
    } catch (e) {
      toast.error("Export impossible", getErrorMessage(e));
    }
  };
  const exportFile = (kind: "excel" | "pdf") => {
    if (env.USE_MOCKS) return toast.info("Export disponible une fois l'API connectée", "Utilisez l'export CSV en attendant.");
    window.open(salesService.exportUrl(kind, params), "_blank");
  };

  const dim = (s: Sale) => s.status !== "valide" && "line-through opacity-50";
  const columns: Column<Sale>[] = [
    {
      key: "product",
      header: "Produit",
      cell: (s) => (
        <div className="flex min-w-0 items-center gap-3 sm:min-w-[210px]">
          <span className="relative size-12 shrink-0 sm:size-11 overflow-hidden rounded-md bg-page">{s.productImage && <Image src={s.productImage} alt="" fill sizes="44px" className={cn("object-cover", s.status !== "valide" && "grayscale")} />}</span>
          <div className="min-w-0">
            <p className={cn("line-clamp-2 font-bold leading-[19px] sm:line-clamp-1", dim(s))}>{s.productName}{s.quantity > 1 && <span className="ml-1.5 rounded bg-chip px-1.5 py-0.5 text-[11px] no-underline">× {s.quantity}</span>}</p>
            <p className="text-[12px] text-ink-3">{s.status !== "valide" && <span className="mr-1.5 rounded bg-chip px-1.5 py-0.5 font-semibold text-ink-2 sm:hidden">{SALE_STATUS_LABEL[s.status]}</span>}{s.category}{s.orderId && <> · <Link href={ROUTES.admin.order(s.orderId)} className="-my-2 inline-block px-1 py-2 text-primary hover:underline">Cmd #{s.orderId}</Link></>}</p>
          </div>
        </div>
      ),
    },
    { key: "client", header: "Vendu à", hideBelow: "md", cell: (s) => <span>{s.venduA ?? s.buyer?.name ?? "—"}</span> },
    ...(canAll ? [{ key: "seller", header: "Vendeur", hideBelow: "xl" as const, cell: (s: Sale) => <span className="text-ink-2">{s.seller?.name ?? "—"}</span> }] : []),
    { key: "date", header: "Date", hideBelow: "lg", cell: (s) => <span className="whitespace-nowrap text-ink-2">{formatDateTime(s.dateAchat)}</span> },
    { key: "method", header: "Paiement", hideBelow: "sm", cell: (s) => <MethodBadge method={s.method} /> },
    {
      key: "price",
      header: "Total",
      align: "right",
      cell: (s) => (
        <div className="whitespace-nowrap">
          <p className={cn("font-bold", dim(s))}>{formatPrice(s.total)}</p>
          {s.quantity > 1 && <p className="text-[11px] text-ink-3">{formatPrice(s.unitPrice)} / u.</p>}
        </div>
      ),
    },
    { key: "profit", header: "Bénéfice", align: "right", hideBelow: "lg", mobile: "hide", cell: (s) => <span className={cn("font-semibold", s.profit < 0 ? "text-danger" : "text-primary-dark", dim(s))}>{formatPrice(s.profit)}</span> },
    {
      key: "status",
      header: "Statut",
      hideBelow: "xl",
      mobile: "hide",
      cell: (s) => (s.status === "valide" ? <StatusDot tone="green">Valide</StatusDot> : <StatusDot tone={s.status === "remboursée" ? "orange" : "gray"}>{SALE_STATUS_LABEL[s.status]}</StatusDot>),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (s) => (
        <div className="flex flex-wrap justify-end gap-2 sm:flex-nowrap sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setDetail(s)} aria-label="Détails" title="Détails" className="grid size-11 place-items-center rounded-full bg-chip transition-colors active:scale-90 sm:size-9 hover:bg-primary hover:text-white"><Eye size={17} /></button>
          {editable(s) && <Link href={ROUTES.admin.saleEdit(s.id)} aria-label="Modifier" title="Modifier" className="grid size-11 place-items-center rounded-full bg-chip transition-colors active:scale-90 sm:size-9 hover:bg-primary hover:text-white"><Edit2 size={17} /></Link>}
          {canRefund && s.status === "valide" && <button onClick={() => setToRefund(s)} aria-label="Rembourser" title="Rembourser / retour" className="grid size-11 place-items-center rounded-full bg-chip transition-colors active:scale-90 sm:size-9 hover:bg-star hover:text-white"><Refresh2 size={17} /></button>}
          {canDelete && <button onClick={() => setToDelete(s)} aria-label="Supprimer" title="Supprimer" className="grid size-11 place-items-center rounded-full bg-chip transition-colors active:scale-90 sm:size-9 hover:bg-danger hover:text-white"><Trash size={17} /></button>}
        </div>
      ),
    },
  ];

  const confirmDelete = () => {
    if (!toDelete) return;
    remove.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Vente supprimée");
        setToDelete(null);
        setDetail(null);
      },
      onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
    });
  };

  return (
    <>
      <PageHeader
        title={isReseller ? "Mes ventes" : "Ventes"}
        description={isReseller ? "Les ventes que vous avez enregistrées, avec leur marge et leur moyen de paiement." : "Suivez toutes les ventes, leur marge et leur moyen de paiement."}
        actions={
          <>
            <Button variant="chip" upper={false} leftIcon={<DocumentDownload size={17} />} onClick={exportCsv} className="max-sm:order-3">CSV</Button>
            {canExport && (
              <>
                <Button variant="chip" upper={false} leftIcon={<DocumentDownload size={17} />} onClick={() => exportFile("excel")} className="max-sm:order-3">Excel</Button>
                <Button variant="chip" upper={false} leftIcon={<DocumentDownload size={17} />} onClick={() => exportFile("pdf")} className="max-sm:order-3">PDF</Button>
              </>
            )}
            {canConvert && <Button href={ROUTES.admin.saleConvert} variant="dark" upper={false} leftIcon={<ReceiptItem size={18} />} className="max-sm:order-2 max-sm:!col-span-2">Convertir une commande</Button>}
            {canCreate && <Button href={ROUTES.admin.saleNew} leftIcon={<Add size={18} />} className="max-sm:order-1 max-sm:!col-span-2">Nouvelle vente</Button>}
          </>
        }
      >
        {canAll && <Tabs variant="pill" value={view} onChange={reset(setView)} tabs={[{ value: "all", label: "Toutes les ventes" }, { value: "revendeur", label: "Ventes revendeurs" }]} />}
      </PageHeader>

      <div>
        <p className="mb-2 px-1 text-[13px] text-ink-2">
          Période : <strong className="text-ink">{data?.periodLabel ?? "…"}</strong>
          {stats && <> · {stats.count} vente{stats.count > 1 ? "s" : ""} valide{stats.count > 1 ? "s" : ""} · {stats.units} unité{stats.units > 1 ? "s" : ""}</>}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard label={`Chiffre d'affaires · ${short}`} value={stats?.revenue ?? 0} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} />
          <StatCard label={`Bénéfice · ${short}`} value={stats?.profit ?? 0} format={formatPrice} icon={<Wallet3 size={22} variant="Bold" />} tone="blue" delay={0.05} />
          <StatCard label={`Nombre de ventes · ${short}`} value={stats?.count ?? 0} icon={<ReceiptItem size={22} variant="Bold" />} tone="orange" delay={0.1} />
          <StatCard label={`Panier moyen · ${short}`} value={stats?.average ?? 0} format={formatPrice} icon={<Chart2 size={22} variant="Bold" />} tone="dark" delay={0.15} />
        </div>
      </div>

      <Block pad="none" className="overflow-hidden">
        {/* Mobile : recherche + « Filtrer » + pastilles actives */}
        <div className="space-y-3 border-b border-line-3 p-4 sm:hidden">
          <MobileSearchRow>
            <input value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Produit, client, n°…" aria-label="Rechercher" inputMode="search" className="field min-w-0 flex-1" />
            <FilterTrigger count={chips.length} onClick={() => setSheet(true)} />
          </MobileSearchRow>
          <ActiveChips chips={chips} />
        </div>
        <FilterSheet open={sheet} onClose={() => setSheet(false)} title="Filtrer les ventes" onReset={resetAll} resetDisabled={chips.length === 0}>
          <div>
            <p className="mb-2 text-[13px] font-semibold">Période</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Période">
              {PRESETS.map((p) => (
                <button key={p || "all"} type="button" aria-pressed={!custom && preset === p} onClick={() => { setCustom(false); reset(setPreset)(p); }} className={chip(!custom && preset === p)}>{p ? `${p} j` : "Tout"}</button>
              ))}
              <button type="button" aria-pressed={custom} onClick={() => { setCustom(true); setPage(1); }} className={chip(custom)}>Personnalisé</button>
            </div>
            {custom && (
              <div className="mt-3 grid gap-3">
                <label className="grid gap-1 text-[12px] font-semibold text-ink-2">Vente du<input type="date" value={dateFrom} onChange={(e) => reset(setDateFrom)(e.target.value)} className="field" /></label>
                <label className="grid gap-1 text-[12px] font-semibold text-ink-2">au<input type="date" value={dateTo} onChange={(e) => reset(setDateTo)(e.target.value)} className="field" /></label>
                <label className="grid gap-1 text-[12px] font-semibold text-ink-2">Enregistrée le<input type="date" value={recordedOn} onChange={(e) => reset(setRecordedOn)(e.target.value)} className="field" /></label>
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold">Moyen de paiement</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Moyen de paiement">
              {METHODS.map((m) => (
                <button key={m} type="button" aria-pressed={method === m} onClick={() => reset(setMethod)(method === m ? "" : m)} className={cn("min-h-10 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all active:scale-95", method === m ? "border-transparent " + METHOD_STYLE[m].cls : "border-line bg-white")}>{METHOD_STYLE[m].label}</button>
              ))}
            </div>
          </div>
          <Select label="Statut" value={status} onChange={(e) => reset(setStatus)(e.target.value as SaleStatus | "")} options={[{ value: "", label: "Tous les statuts" }, ...(Object.keys(SALE_STATUS_LABEL) as SaleStatus[]).map((x) => ({ value: x, label: SALE_STATUS_LABEL[x] }))]} />
          {canAll && <Select label="Vendeur" value={sellerId ?? ""} onChange={(e) => reset(setSellerId)(e.target.value ? Number(e.target.value) : null)} options={[{ value: "", label: "Tous les vendeurs" }, ...(sellers ?? []).map((x) => ({ value: x.id, label: x.name }))]} />}
        </FilterSheet>
        {/* Desktop / tablette */}
        <div className="hidden space-y-3 border-b border-line-3 p-5 sm:block">
          <div className="flex flex-wrap items-center gap-3">
            <input value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Produit, client, vendeur ou n°…" aria-label="Rechercher" className="field w-full sm:w-[260px]" />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Période">
              {PRESETS.map((p) => (
                <button key={p || "all"} type="button" aria-pressed={!custom && preset === p} onClick={() => { setCustom(false); reset(setPreset)(p); }} className={chip(!custom && preset === p)}>
                  {p ? `${p} j` : "Tout"}
                </button>
              ))}
              <button type="button" aria-pressed={custom} onClick={() => { setCustom(true); setPage(1); }} className={chip(custom)}>Personnalisé</button>
            </div>
            <Select aria-label="Statut" value={status} onChange={(e) => reset(setStatus)(e.target.value as SaleStatus | "")} wrapperClassName="w-[170px]" className="h-10 text-[13px]" options={[{ value: "", label: "Tous les statuts" }, ...(Object.keys(SALE_STATUS_LABEL) as SaleStatus[]).map((s) => ({ value: s, label: SALE_STATUS_LABEL[s] }))]} />
            {canAll && (
              <Select aria-label="Vendeur" value={sellerId ?? ""} onChange={(e) => reset(setSellerId)(e.target.value ? Number(e.target.value) : null)} wrapperClassName="w-[200px]" className="h-10 text-[13px]" options={[{ value: "", label: "Tous les vendeurs" }, ...(sellers ?? []).map((s) => ({ value: s.id, label: s.name }))]} />
            )}
          </div>
          {custom && (
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-2">
              <label className="flex items-center gap-2">Vente du <input type="date" value={dateFrom} onChange={(e) => reset(setDateFrom)(e.target.value)} className="field h-10 w-[150px]" /></label>
              <label className="flex items-center gap-2">au <input type="date" value={dateTo} onChange={(e) => reset(setDateTo)(e.target.value)} className="field h-10 w-[150px]" /></label>
              <label className="flex items-center gap-2">Enregistrée le <input type="date" value={recordedOn} onChange={(e) => reset(setRecordedOn)(e.target.value)} className="field h-10 w-[150px]" /></label>
            </div>
          )}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Moyen de paiement">
            {METHODS.map((m) => (
              <button key={m} type="button" aria-pressed={method === m} onClick={() => reset(setMethod)(method === m ? "" : m)} className={cn("rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-all", method === m ? "border-transparent " + METHOD_STYLE[m].cls : "border-line bg-white hover:border-primary hover:text-primary")}>
                {METHOD_STYLE[m].label}
              </button>
            ))}
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={data?.results}
          rowKey={(s) => s.id}
          loading={isLoading}
          onRowClick={setDetail}
          page={page}
          pageCount={Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE))}
          onPageChange={setPage}
          empty={<EmptyState icon={<ReceiptItem size={38} variant="Bulk" />} title="Aucune vente" description="Aucune vente ne correspond à vos filtres." action={canCreate ? <Button href={ROUTES.admin.saleNew}>Enregistrer une vente</Button> : undefined} />}
        />
      </Block>

      <SaleDetailDrawer
        sale={detail}
        onClose={() => setDetail(null)}
        canEdit={!!detail && editable(detail)}
        canRefund={canRefund && detail?.status === "valide"}
        canDelete={canDelete}
        onRefund={(s) => { setDetail(null); setToRefund(s); }}
        onDelete={(s) => setToDelete(s)}
      />
      <RefundDialog sale={toRefund} onClose={() => setToRefund(null)} />
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={remove.isPending} title="Supprimer cette vente ?" message={`La vente de « ${toDelete?.productName ?? ""} » sera supprimée définitivement et le stock rétabli.`} confirmLabel="Supprimer" />
    </>
  );
}

export function SalesListView() {
  return (
    <PermissionGuard permission="sales.view.own">
      <SalesListContent />
    </PermissionGuard>
  );
}
