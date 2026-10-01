"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Add, Chart2, DocumentDownload, Edit2, MoneyRecive, ReceiptItem, Trash, Wallet3 } from "iconsax-reactjs";
import { env } from "@/config/env";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDateTime, formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Tabs } from "@/shared/ui/Tabs";
import { toast } from "@/shared/ui/Toast";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { DataTable, type Column } from "../../ui/DataTable";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useDeleteSale, useSales } from "../hooks/useSales";
import { salesService } from "../services/sales.service";
import { METHOD_STYLE, type PaymentMethod, type Sale, type SaleListParams } from "../types";

const PAGE_SIZE = 10;
const METHODS = Object.keys(METHOD_STYLE) as PaymentMethod[];

export function MethodBadge({ method }: { method: PaymentMethod }) {
  const m = METHOD_STYLE[method];
  return <span className={cn("inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold", m.cls)}>{m.label}</span>;
}

export function SalesListView() {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [view, setView] = useState<"all" | "revendeur">("all");
  const [page, setPage] = useState(1);
  const q = useDebounce(search, 300);
  const params: SaleListParams = { search: q, method, dateFrom, dateTo, view, page, pageSize: PAGE_SIZE };
  const { data, isLoading } = useSales(params);
  const remove = useDeleteSale();
  const [toDelete, setToDelete] = useState<Sale | null>(null);
  const stats = data?.stats;
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const onExport = (kind: "excel" | "pdf") => {
    if (env.USE_MOCKS) return toast.info("Export disponible une fois l'API connectée");
    window.open(salesService.exportUrl(kind, params), "_blank");
  };

  const columns: Column<Sale>[] = [
    {
      key: "product",
      header: "Produit",
      cell: (s) => (
        <div className="flex min-w-[200px] items-center gap-3">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-page">{s.productImage && <Image src={s.productImage} alt="" fill sizes="44px" className="object-cover" />}</span>
          <div className="min-w-0">
            <p className="line-clamp-1 font-bold">{s.productName}</p>
            <p className="text-[12px] text-ink-3">{s.category}</p>
          </div>
        </div>
      ),
    },
    { key: "client", header: "Client", hideBelow: "md", cell: (s) => <span>{s.venduA ?? s.buyer?.name ?? "—"}</span> },
    { key: "seller", header: "Revendeur", hideBelow: "xl", cell: (s) => <span className="text-ink-2">{s.seller?.name ?? "—"}</span> },
    { key: "date", header: "Date", hideBelow: "lg", cell: (s) => <span className="whitespace-nowrap text-ink-2">{formatDateTime(s.dateAchat)}</span> },
    { key: "method", header: "Paiement", hideBelow: "sm", cell: (s) => <MethodBadge method={s.method} /> },
    { key: "price", header: "Prix final", align: "right", cell: (s) => <span className="font-bold">{formatPrice(s.priceFinal)}</span> },
    { key: "profit", header: "Bénéfice", align: "right", hideBelow: "lg", cell: (s) => <span className={cn("font-semibold", s.profit < 0 ? "text-danger" : "text-primary-dark")}>{formatPrice(s.profit)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (s) => (
        <div className="flex justify-end gap-1.5">
          <Link href={ROUTES.admin.saleEdit(s.id)} aria-label="Modifier" title="Modifier" className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white"><Edit2 size={17} /></Link>
          <button onClick={() => setToDelete(s)} aria-label="Supprimer" title="Supprimer" className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-danger hover:text-white"><Trash size={17} /></button>
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
      },
      onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
    });
  };

  return (
    <>
      <PageHeader
        title="Ventes"
        description="Suivez toutes les ventes, leur marge et leur moyen de paiement."
        actions={
          <>
            <Button variant="chip" upper={false} leftIcon={<DocumentDownload size={17} />} onClick={() => onExport("excel")}>Excel</Button>
            <Button variant="chip" upper={false} leftIcon={<DocumentDownload size={17} />} onClick={() => onExport("pdf")}>PDF</Button>
            <Button href={ROUTES.admin.saleNew} leftIcon={<Add size={18} />}>Nouvelle vente</Button>
          </>
        }
      >
        <Tabs variant="pill" value={view} onChange={reset(setView)} tabs={[{ value: "all", label: "Toutes les ventes" }, { value: "revendeur", label: "Ventes revendeurs" }]} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Chiffre d'affaires" value={stats?.revenue ?? 0} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} />
        <StatCard label="Bénéfice" value={stats?.profit ?? 0} format={formatPrice} icon={<Wallet3 size={22} variant="Bold" />} tone="blue" delay={0.05} />
        <StatCard label="Nombre de ventes" value={stats?.count ?? 0} icon={<ReceiptItem size={22} variant="Bold" />} tone="orange" delay={0.1} />
        <StatCard label="Panier moyen" value={stats?.average ?? 0} format={formatPrice} icon={<Chart2 size={22} variant="Bold" />} tone="dark" delay={0.15} />
      </div>

      <Block pad="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line-3 p-4 sm:p-5">
          <input value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Produit ou client…" aria-label="Rechercher" className="field w-full sm:w-[240px]" />
          <label className="flex items-center gap-2 text-[13px] text-ink-2">Du <input type="date" value={dateFrom} onChange={(e) => reset(setDateFrom)(e.target.value)} className="field w-[150px]" /></label>
          <label className="flex items-center gap-2 text-[13px] text-ink-2">au <input type="date" value={dateTo} onChange={(e) => reset(setDateTo)(e.target.value)} className="field w-[150px]" /></label>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={method === m}
                onClick={() => reset(setMethod)(method === m ? "" : m)}
                className={cn("rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-all", method === m ? "border-transparent text-white " + METHOD_STYLE[m].cls : "border-line bg-white hover:border-primary hover:text-primary")}
              >
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
          page={page}
          pageCount={Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE))}
          onPageChange={setPage}
          empty={<EmptyState icon={<ReceiptItem size={38} variant="Bulk" />} title="Aucune vente" description="Aucune vente ne correspond à vos filtres." action={<Button href={ROUTES.admin.saleNew}>Enregistrer une vente</Button>} />}
        />
      </Block>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title="Supprimer cette vente ?"
        message={`La vente de « ${toDelete?.productName ?? ""} » sera supprimée définitivement.`}
        confirmLabel="Supprimer"
      />
    </>
  );
}
