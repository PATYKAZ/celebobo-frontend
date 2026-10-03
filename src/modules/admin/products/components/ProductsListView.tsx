"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useEffect, useState } from "react";
import { Add, ArrowSwapVertical, Box, DocumentDownload, DocumentUpload, Edit2, Eye, EyeSlash, Filter, Refresh2, Star1, Tag, Trash, Warning2, Wallet3, Clock } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Pill } from "@/shared/ui/Badges";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input, Select } from "@/shared/ui/Form";
import { Tabs } from "@/shared/ui/Tabs";
import { toast } from "@/shared/ui/Toast";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { useAdminCategories } from "../../categories/hooks/useAdminCategories";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { DataTable, type Column } from "../../ui/DataTable";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useAdminProductFilters } from "../hooks/useAdminProductFilters";
import { useAdminProducts, useBulkProducts, useRestoreProducts, useTrashProducts } from "../hooks/useAdminProducts";
import { adminProductsService } from "../services/admin-products.service";
import { BADGE_OPTIONS, type BulkAction, type ProductStatusFilter } from "../types";
import { BulkBar } from "./BulkBar";
import { ActiveChips, FilterSheet, FilterTrigger, MobileSearchRow, type FilterChip } from "./FilterSheet";
import { CsvImportModal } from "./CsvImportModal";
import { DeadlineBadge, StockPill } from "./StockBadges";
import { StockAdjustModal } from "./StockAdjustModal";
import { StockHistoryDrawer } from "./StockHistoryDrawer";

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("h-12 rounded-box border px-3 text-[13px] font-semibold transition-colors active:scale-[0.97] sm:h-[45px] sm:px-4", active ? "border-primary bg-primary text-white" : "border-line bg-white hover:border-primary hover:text-primary")}
    >
      {children}
    </button>
  );
}

const iconBtn = "grid size-11 place-items-center rounded-full bg-chip transition-colors active:scale-90 sm:size-9";

function Content() {
  const { params, set, reset, activeCount } = useAdminProductFilters();
  const canManage = useCan("products.manage");
  const canStock = useCan("stock.adjust");
  const canImport = useCan("products.import");
  const canCategories = useCan("categories.manage");
  // les catégories masquées ne sont visibles que de ceux qui gèrent le catalogue
  const { data: adminCategories } = useAdminCategories(canCategories);
  const { data: shopCategories } = useCategories();
  const categories = canCategories ? adminCategories : shopCategories;

  const [search, setSearch] = useState(params.search ?? "");
  const debounced = useDebounce(search, 300);
  useEffect(() => {
    if (debounced !== (params.search ?? "")) set({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const [advanced, setAdvanced] = useState(false);
  const [sheet, setSheet] = useState(false);
  const { data, isLoading } = useAdminProducts(params);
  const trash = useTrashProducts();
  const restore = useRestoreProducts();
  const bulk = useBulkProducts();
  const stats = data?.stats;

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [toTrash, setToTrash] = useState<Product | null>(null);
  const [adjust, setAdjust] = useState<Product | null>(null);
  const [history, setHistory] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // la sélection ne survit pas à un changement de filtre / page
  const key = JSON.stringify(params);
  useEffect(() => setSelected(new Set()), [key]);

  const catName = (categories ?? []).find((c) => c.id === params.category)?.name;
  const chips: FilterChip[] = [
    ...(params.category ? [{ key: "cat", label: catName ?? "Catégorie", onRemove: () => set({ cat: "" }) }] : []),
    ...(params.onSale ? [{ key: "sale", label: "En promo", onRemove: () => set({ sale: false }) }] : []),
    ...(params.lowStock ? [{ key: "low", label: "Stock bas", onRemove: () => set({ low: false }) }] : []),
    ...(params.outOfStock ? [{ key: "out", label: "Rupture", onRemove: () => set({ out: false }) }] : []),
    ...(params.badge ? [{ key: "badge", label: BADGE_OPTIONS.find((b) => b.value === params.badge)?.label ?? params.badge, onRemove: () => set({ badge: "" }) }] : []),
    ...(params.minPrice != null ? [{ key: "min", label: `≥ ${formatPrice(params.minPrice)}`, onRemove: () => set({ min: "" }) }] : []),
    ...(params.maxPrice != null ? [{ key: "max", label: `≤ ${formatPrice(params.maxPrice)}`, onRemove: () => set({ max: "" }) }] : []),
  ];

  const rows = data?.results ?? [];
  const allChecked = rows.length > 0 && rows.every((p) => selected.has(p.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map((p) => p.id)));
  const toggleOne = (id: number) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const runBulk = (action: BulkAction) =>
    bulk.mutate({ ids: [...selected], action }, { onSuccess: (r) => { toast.success("Action appliquée", `${r.updated} produit(s)`); setSelected(new Set()); }, onError: (e) => toast.error("Action impossible", getErrorMessage(e)) });

  const exportCsv = async () => {
    setExporting(true);
    try {
      await adminProductsService.exportCatalog("csv");
      toast.success("Export prêt", "Le fichier du catalogue a été téléchargé.");
    } catch (e) {
      toast.error("Export impossible", getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<Product>[] = [
    ...(canManage
      ? [{
          key: "select",
          header: <input type="checkbox" aria-label="Tout sélectionner" checked={allChecked} onChange={toggleAll} className="size-4 cursor-pointer accent-primary" />,
          className: "w-10",
          cell: (p: Product) => (
            <label className="-m-3 grid size-11 cursor-pointer place-items-center sm:m-0 sm:size-auto" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" aria-label={`Sélectionner ${p.name}`} checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} className="size-5 cursor-pointer accent-primary sm:size-4" />
            </label>
          ),
        } satisfies Column<Product>]
      : []),
    {
      key: "product",
      header: "Produit",
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-3 sm:min-w-[220px]">
          <span className={cn("relative size-14 shrink-0 sm:size-12 overflow-hidden rounded-md bg-page", p.isActive === false && "opacity-50 grayscale")}>{p.image && <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />}</span>
          <div className="min-w-0">
            <Link prefetch={false} href={ROUTES.admin.product(p.id)} className="-my-1.5 line-clamp-2 py-1.5 font-bold leading-[19px] hover:text-primary sm:line-clamp-1">{p.name}</Link>
            <p className="flex items-center gap-1.5 text-[12px] text-ink-3">
              {p.category}
              {p.isActive === false && <span className="inline-flex items-center gap-0.5 font-semibold text-ink-2"><EyeSlash size={12} /> masqué</span>}
              {p.variants.length > 0 && <span>· {p.variants.length} variantes</span>}
            </p>
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
    ...(canManage
      ? [
          { key: "cost", header: "Achat", align: "right", hideBelow: "lg", mobile: "hide", cell: (p: Product) => <span className="text-ink-2">{p.pricePrimary != null ? formatPrice(p.pricePrimary) : "—"}</span> } satisfies Column<Product>,
          {
            key: "margin",
            header: "Marge",
            align: "right",
            hideBelow: "lg",
            mobile: "hide",
            cell: (p: Product) => {
              if (p.pricePrimary == null) return <span className="text-ink-3">—</span>;
              const cur = getPricing(p).current;
              const m = ((cur - p.pricePrimary) / cur) * 100;
              return <span className={cn("font-semibold", m < 10 ? "text-danger" : "text-primary-dark")}>{m.toFixed(0)}%</span>;
            },
          } satisfies Column<Product>,
        ]
      : []),
    { key: "promo", header: "Promo", hideBelow: "md", cell: (p) => (getPricing(p).onSale ? <Pill tone="red">-{getPricing(p).percent}%</Pill> : <span className="text-ink-3">—</span>) },
    { key: "stock", header: "Stock", cell: (p) => <StockPill product={p} /> },
    {
      key: "deadline",
      header: "À vendre avant",
      hideBelow: "xl",
      cell: (p) => (p.dateWish ? <div className="flex flex-col items-start gap-1"><span className="text-[13px] text-ink-2">{formatDate(p.dateWish)}</span><DeadlineBadge dateWish={p.dateWish} /></div> : <span className="text-ink-3">—</span>),
    },
    {
      key: "rating",
      header: "Note",
      hideBelow: "xl",
      mobile: "hide",
      cell: (p) => (p.rating ? <span className="inline-flex items-center gap-1 font-semibold"><Star1 size={14} variant="Bold" color="#FFA500" />{p.rating.toFixed(1)} <span className="font-normal text-ink-3">({p.reviewsCount})</span></span> : <span className="text-ink-3">—</span>),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (p) => (
        <div className="flex flex-wrap justify-end gap-2 sm:flex-nowrap sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
          {params.status === "trash" ? (
            <>
              {canManage && <button onClick={() => restore.mutate([p.id], { onSuccess: () => toast.success("Produit restauré", p.name), onError: (e) => toast.error("Restauration impossible", getErrorMessage(e)) })} aria-label="Restaurer" title="Restaurer" className={cn(iconBtn, "hover:bg-primary hover:text-white")}><Refresh2 size={17} /></button>}
            </>
          ) : (
            <>
              <Link prefetch={false} href={ROUTES.admin.product(p.id)} aria-label="Voir" title="Voir" className={cn(iconBtn, "hover:bg-primary hover:text-white")}><Eye size={17} /></Link>
              <button onClick={() => setHistory(p)} aria-label="Historique du stock" title="Historique du stock" className={cn(iconBtn, "hover:bg-primary hover:text-white")}><Clock size={17} /></button>
              {canStock && <button onClick={() => setAdjust(p)} aria-label="Ajuster le stock" title="Ajuster le stock" className={cn(iconBtn, "hover:bg-primary hover:text-white")}><ArrowSwapVertical size={17} /></button>}
              {canManage && <Link href={ROUTES.admin.productEdit(p.id)} aria-label="Modifier" title="Modifier" className={cn(iconBtn, "hover:bg-primary hover:text-white")}><Edit2 size={17} /></Link>}
              {canManage && <button onClick={() => setToTrash(p)} aria-label="Mettre à la corbeille" title="Mettre à la corbeille" className={cn(iconBtn, "hover:bg-danger hover:text-white")}><Trash size={17} /></button>}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Produits"
        description={canManage ? "Gérez votre catalogue : prix, promotions, stock, variantes et visuels." : "Consultez le catalogue (lecture seule)."}
        actions={
          <>
            {canManage && <Button variant="chip" upper={false} loading={exporting} leftIcon={<DocumentDownload size={17} />} onClick={exportCsv}>Exporter CSV</Button>}
            {canImport && <Button variant="chip" upper={false} leftIcon={<DocumentUpload size={17} />} onClick={() => setImportOpen(true)}>Importer CSV</Button>}
            {canManage && <Button href={ROUTES.admin.productNew} leftIcon={<Add size={18} />}>Nouveau produit</Button>}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatCard label="Produits actifs" value={stats?.total ?? 0} icon={<Box size={22} variant="Bold" />} tone="green" />
        <StatCard label="En promotion" value={stats?.onSale ?? 0} icon={<Tag size={22} variant="Bold" />} tone="red" delay={0.05} />
        <StatCard label="Stock bas" value={stats?.lowStock ?? 0} icon={<Warning2 size={22} variant="Bold" />} tone="orange" delay={0.1} />
        <StatCard label="En rupture" value={stats?.outOfStock ?? 0} icon={<Warning2 size={22} variant="Bold" />} tone="dark" delay={0.15} />
        <StatCard label="Valeur du stock (achat)" value={stats?.stockValue ?? 0} format={formatPrice} icon={<Wallet3 size={22} variant="Bold" />} tone="blue" delay={0.2} className="col-span-2 xl:col-span-1" />
      </div>

      <Block pad="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-3 px-4 pb-3 pt-4 sm:px-5">
          <Tabs<ProductStatusFilter>
            variant="pill"
            value={params.status}
            onChange={(v) => set({ status: v === "trash" ? "trash" : null })}
            tabs={[{ value: "active", label: "Actifs" }, { value: "trash", label: "Corbeille", count: stats?.trashed ?? 0 }]}
          />
        </div>
        {/* Mobile : recherche + « Filtrer » (feuille) + pastilles des filtres actifs */}
        <div className="space-y-3 border-b border-line-3 p-4 sm:hidden">
          <MobileSearchRow>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher" inputMode="search" className="field min-w-0 flex-1" />
            <FilterTrigger count={activeCount} onClick={() => setSheet(true)} />
          </MobileSearchRow>
          <ActiveChips chips={chips} />
        </div>
        <FilterSheet open={sheet} onClose={() => setSheet(false)} title="Filtrer les produits" onReset={() => { reset(); setSearch(""); }} resetDisabled={activeCount === 0}>
          <Select label="Catégorie" value={params.category ? String(params.category) : ""} onChange={(e) => set({ cat: e.target.value })} options={[{ value: "", label: "Toutes les catégories" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
          <div>
            <p className="mb-2 text-[13px] font-semibold">Disponibilité</p>
            <div className="grid grid-cols-3 gap-2">
              <Toggle active={!!params.onSale} onClick={() => set({ sale: !params.onSale })}>En promo</Toggle>
              <Toggle active={!!params.lowStock} onClick={() => set({ low: !params.lowStock, out: undefined })}>Stock bas</Toggle>
              <Toggle active={!!params.outOfStock} onClick={() => set({ out: !params.outOfStock, low: undefined })}>Rupture</Toggle>
            </div>
          </div>
          <Select label="Badge" value={params.badge ?? ""} onChange={(e) => set({ badge: e.target.value })} options={[{ value: "", label: "Tous" }, ...BADGE_OPTIONS.filter((b) => b.value)]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prix min ($)" type="number" inputMode="decimal" min="0" value={params.minPrice ?? ""} onChange={(e) => set({ min: e.target.value })} />
            <Input label="Prix max ($)" type="number" inputMode="decimal" min="0" value={params.maxPrice ?? ""} onChange={(e) => set({ max: e.target.value })} />
          </div>
        </FilterSheet>
        <div className="hidden flex-wrap items-center gap-3 border-b border-line-3 p-5 sm:flex">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher" className="field w-full sm:w-[260px]" />
          <Select
            aria-label="Catégorie"
            wrapperClassName="w-full sm:w-[200px]"
            value={params.category ? String(params.category) : ""}
            onChange={(e) => set({ cat: e.target.value })}
            options={[{ value: "", label: "Toutes les catégories" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]}
          />
          <Toggle active={!!params.onSale} onClick={() => set({ sale: !params.onSale })}>En promo</Toggle>
          <Toggle active={!!params.lowStock} onClick={() => set({ low: !params.lowStock, out: undefined })}>Stock bas</Toggle>
          <Toggle active={!!params.outOfStock} onClick={() => set({ out: !params.outOfStock, low: undefined })}>Rupture</Toggle>
          <button onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} className={cn("inline-flex h-[45px] items-center gap-2 rounded-box border px-4 text-[13px] font-semibold transition-colors", advanced ? "border-primary text-primary" : "border-line hover:border-primary hover:text-primary")}>
            <Filter size={16} /> Filtres avancés
          </button>
          {activeCount > 0 && <button onClick={() => { reset(); setSearch(""); }} className="text-[13px] font-semibold text-danger hover:underline">Réinitialiser ({activeCount})</button>}
        </div>
        <AnimatePresence initial={false}>
          {advanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="hidden overflow-hidden border-b border-line-3 sm:block">
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
                <Select label="Badge" value={params.badge ?? ""} onChange={(e) => set({ badge: e.target.value })} options={[{ value: "", label: "Tous" }, ...BADGE_OPTIONS.filter((b) => b.value)]} />
                <Input label="Prix min ($)" type="number" min="0" value={params.minPrice ?? ""} onChange={(e) => set({ min: e.target.value })} />
                <Input label="Prix max ($)" type="number" min="0" value={params.maxPrice ?? ""} onChange={(e) => set({ max: e.target.value })} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(p) => p.id}
          loading={isLoading}
          page={params.page}
          pageCount={Math.max(1, Math.ceil((data?.count ?? 0) / 10))}
          onPageChange={(p) => set({ page: p })}
          empty={
            <EmptyState
              icon={<Box size={38} variant="Bulk" />}
              title={params.status === "trash" ? "Corbeille vide" : "Aucun produit"}
              description={params.status === "trash" ? "Les produits supprimés apparaissent ici et peuvent être restaurés." : "Aucun produit ne correspond à vos filtres."}
              action={canManage && params.status !== "trash" ? <Button href={ROUTES.admin.productNew}>Ajouter un produit</Button> : undefined}
            />
          }
        />
      </Block>

      <BulkBar count={selected.size} status={params.status} busy={bulk.isPending} onClear={() => setSelected(new Set())} onAction={runBulk} />

      <ConfirmDialog
        open={!!toTrash}
        onClose={() => setToTrash(null)}
        onConfirm={() => toTrash && trash.mutate([toTrash.id], { onSuccess: () => { toast.success("Produit mis à la corbeille", `${toTrash.name} — restaurable depuis l'onglet Corbeille`); setToTrash(null); }, onError: (e) => toast.error("Action impossible", getErrorMessage(e)) })}
        loading={trash.isPending}
        title="Mettre ce produit à la corbeille ?"
        message={`« ${toTrash?.name ?? ""} » ne sera plus visible en boutique. Vous pourrez le restaurer depuis l'onglet Corbeille.`}
        confirmLabel="Mettre à la corbeille"
      />

      <StockAdjustModal product={adjust} onClose={() => setAdjust(null)} />
      <StockHistoryDrawer product={history} onClose={() => setHistory(null)} />
      <CsvImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}

export function ProductsListView() {
  return (
    <PermissionGuard permission="products.view">
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </PermissionGuard>
  );
}
