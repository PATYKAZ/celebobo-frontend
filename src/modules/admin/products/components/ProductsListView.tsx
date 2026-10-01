"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Add, Box, Edit2, Eye, Star1, Tag, Trash, Warning2, Wallet3 } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Pill } from "@/shared/ui/Badges";
import { Select } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { DataTable, type Column } from "../../ui/DataTable";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useAdminProducts, useDeleteProduct } from "../hooks/useAdminProducts";

const PAGE_SIZE = 10;

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("h-[45px] rounded-box border px-4 text-[13px] font-semibold transition-colors", active ? "border-primary bg-primary text-white" : "border-line bg-white hover:border-primary hover:text-primary")}
    >
      {children}
    </button>
  );
}

export function ProductsListView() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [onSale, setOnSale] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const [page, setPage] = useState(1);
  const q = useDebounce(search, 300);
  const { data: categories } = useCategories();
  const { data, isLoading } = useAdminProducts({ search: q, category: category ? Number(category) : null, onSale, outOfStock, page, pageSize: PAGE_SIZE });
  const remove = useDeleteProduct();
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const stats = data?.stats;
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const columns: Column<Product>[] = [
    {
      key: "product",
      header: "Produit",
      cell: (p) => (
        <div className="flex min-w-[220px] items-center gap-3">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-page">{p.image && <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />}</span>
          <div className="min-w-0">
            <Link href={ROUTES.admin.product(p.id)} className="line-clamp-1 font-bold hover:text-primary">{p.name}</Link>
            <p className="text-[12px] text-ink-3">{p.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Prix",
      align: "right",
      cell: (p) => {
        const pr = getPricing(p);
        return (
          <div>
            <p className={cn("font-bold", pr.onSale && "text-danger")}>{formatPrice(pr.current)}</p>
            {pr.original && <p className="text-[12px] text-ink-3 line-through">{formatPrice(pr.original)}</p>}
          </div>
        );
      },
    },
    { key: "cost", header: "Prix d'achat", align: "right", hideBelow: "lg", cell: (p) => <span className="text-ink-2">{p.pricePrimary != null ? formatPrice(p.pricePrimary) : "—"}</span> },
    {
      key: "margin",
      header: "Marge",
      align: "right",
      hideBelow: "lg",
      cell: (p) => {
        if (p.pricePrimary == null) return <span className="text-ink-3">—</span>;
        const cur = getPricing(p).current;
        const m = ((cur - p.pricePrimary) / cur) * 100;
        return <span className={cn("font-semibold", m < 10 ? "text-danger" : "text-primary-dark")}>{m.toFixed(0)}%</span>;
      },
    },
    { key: "promo", header: "Promo", hideBelow: "md", cell: (p) => (getPricing(p).onSale ? <Pill tone="red">-{getPricing(p).percent}%</Pill> : <span className="text-ink-3">—</span>) },
    { key: "stock", header: "Stock", cell: (p) => (p.inStock ? <Pill tone="green">En stock</Pill> : <Pill tone="red">Rupture</Pill>) },
    {
      key: "rating",
      header: "Note",
      hideBelow: "xl",
      cell: (p) => (p.rating ? <span className="inline-flex items-center gap-1 font-semibold"><Star1 size={14} variant="Bold" color="#FFA500" />{p.rating.toFixed(1)} <span className="font-normal text-ink-3">({p.reviewsCount})</span></span> : <span className="text-ink-3">—</span>),
    },
    { key: "date", header: "Ajouté", hideBelow: "xl", cell: (p) => <span className="text-ink-2">{formatDate(p.dateAdded)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (p) => (
        <div className="flex justify-end gap-1.5">
          <Link href={ROUTES.admin.product(p.id)} aria-label="Voir" title="Voir" className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white"><Eye size={17} /></Link>
          <Link href={ROUTES.admin.productEdit(p.id)} aria-label="Modifier" title="Modifier" className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white"><Edit2 size={17} /></Link>
          <button onClick={() => setToDelete(p)} aria-label="Supprimer" title="Supprimer" className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-danger hover:text-white"><Trash size={17} /></button>
        </div>
      ),
    },
  ];

  const confirmDelete = () => {
    if (!toDelete) return;
    remove.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Produit supprimé", toDelete.name);
        setToDelete(null);
      },
      onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
    });
  };

  return (
    <>
      <PageHeader
        title="Produits"
        description="Gérez votre catalogue : prix, promotions, stock et visuels."
        actions={<Button href={ROUTES.admin.productNew} leftIcon={<Add size={18} />}>Nouveau produit</Button>}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Produits" value={stats?.total ?? 0} icon={<Box size={22} variant="Bold" />} tone="green" />
        <StatCard label="En promotion" value={stats?.onSale ?? 0} icon={<Tag size={22} variant="Bold" />} tone="red" delay={0.05} />
        <StatCard label="En rupture" value={stats?.outOfStock ?? 0} icon={<Warning2 size={22} variant="Bold" />} tone="orange" delay={0.1} />
        <StatCard label="Valeur du stock (achat)" value={stats?.stockValue ?? 0} format={formatPrice} icon={<Wallet3 size={22} variant="Bold" />} tone="blue" delay={0.15} />
      </div>

      <Block pad="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line-3 p-4 sm:p-5">
          <input value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher" className="field w-full sm:w-[280px]" />
          <Select
            aria-label="Catégorie"
            wrapperClassName="w-full sm:w-[220px]"
            value={category}
            onChange={(e) => reset(setCategory)(e.target.value)}
            options={[{ value: "", label: "Toutes les catégories" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]}
          />
          <Toggle active={onSale} onClick={() => reset(setOnSale)(!onSale)}>En promo</Toggle>
          <Toggle active={outOfStock} onClick={() => reset(setOutOfStock)(!outOfStock)}>Rupture de stock</Toggle>
        </div>
        <DataTable
          columns={columns}
          rows={data?.results}
          rowKey={(p) => p.id}
          loading={isLoading}
          page={page}
          pageCount={Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE))}
          onPageChange={setPage}
          empty={<EmptyState icon={<Box size={38} variant="Bulk" />} title="Aucun produit" description="Aucun produit ne correspond à vos filtres." action={<Button href={ROUTES.admin.productNew}>Ajouter un produit</Button>} />}
        />
      </Block>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title="Supprimer ce produit ?"
        message={`« ${toDelete?.name ?? ""} » sera définitivement supprimé du catalogue. Cette action est irréversible.`}
        confirmLabel="Supprimer"
      />
    </>
  );
}
