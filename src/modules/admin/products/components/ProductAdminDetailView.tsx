"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { ArrowSwapVertical, Chart2, Clock, Edit2, MoneyRecive, Refresh2, Shop, Trash } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Pill } from "@/shared/ui/Badges";
import { Input } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Stars } from "@/shared/ui/Stars";
import { toast } from "@/shared/ui/Toast";
import { Reveal } from "@/shared/animations/Reveal";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { useProductReviews } from "@/modules/products/hooks/useProducts";
import { getPricing } from "@/modules/products/utils";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useAdminProduct, usePurgeProduct, useProductSalesStats, useRestoreProducts, useTrashProducts } from "../hooks/useAdminProducts";
import { deadlineState } from "../types";
import { DeadlineBadge, StockPill } from "./StockBadges";
import { StockAdjustModal } from "./StockAdjustModal";
import { StockHistoryDrawer } from "./StockHistoryDrawer";

function Content({ id }: { id: number }) {
  const router = useRouter();
  const { data: p, isLoading, isError } = useAdminProduct(id);
  const { data: st } = useProductSalesStats(id);
  const { data: reviews } = useProductReviews(id);
  const canManage = useCan("products.manage");
  const canStock = useCan("stock.adjust");
  const canPurge = useCan("products.delete");
  const trash = useTrashProducts();
  const restore = useRestoreProducts();
  const purge = usePurgeProduct();
  const [active, setActive] = useState(0);
  const [confirm, setConfirm] = useState<"trash" | "purge" | null>(null);
  const [purgeText, setPurgeText] = useState("");
  const [adjust, setAdjust] = useState(false);
  const [history, setHistory] = useState(false);

  if (isLoading) return <Block className="space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-80 w-full" /></Block>;
  if (isError || !p) {
    return (
      <Block className="py-16 text-center">
        <h2 className="text-[20px]">Produit introuvable</h2>
        <Button href={ROUTES.admin.products} className="mt-6">Retour aux produits</Button>
      </Block>
    );
  }

  const pr = getPricing(p);
  const trashed = !!p.deletedAt;
  const dl = deadlineState(p.dateWish);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews?.filter((r) => r.rating === n).length ?? 0 }));
  const totalR = reviews?.length ?? 0;

  const facts: [string, ReactNode][] = [
    ["Catégorie", p.category],
    ["Prix de vente", <span key="p" className={cn("font-bold", pr.onSale && "text-danger")}>{formatPrice(pr.current)}{pr.original && <span className="ml-2 font-normal text-ink-3 line-through">{formatPrice(pr.original)}</span>}</span>],
    ...(canManage
      ? ([
          ["Prix d'achat", p.pricePrimary != null ? formatPrice(p.pricePrimary) : "—"],
          ["Marge unitaire", p.pricePrimary != null ? formatPrice(pr.current - p.pricePrimary) : "—"],
        ] as [string, ReactNode][])
      : []),
    ["Stock", <span key="s" className="inline-flex items-center gap-2"><StockPill product={p} /><span className="text-[12px] font-normal text-ink-3">seuil {p.stockThreshold}</span></span>],
    ["Livraison", p.freeShipping ? "Offerte" : p.shippingFee != null ? formatPrice(p.shippingFee) : "—"],
    ["Badge", p.currentBadge || "—"],
    ["Visibilité", p.isActive === false ? <Pill key="v" tone="gray">Masqué en boutique</Pill> : <Pill key="v" tone="green">Visible</Pill>],
    ["Ajouté le", formatDate(p.dateAdded)],
  ];

  return (
    <>
      <PageHeader
        title={p.name}
        description={p.description}
        actions={
          <>
            {!trashed && <Button href={ROUTES.product(p.id)} variant="chip" upper={false} leftIcon={<Shop size={17} />}>Voir en boutique</Button>}
            {canManage && !trashed && <Button href={ROUTES.admin.productEdit(p.id)} upper={false} leftIcon={<Edit2 size={17} />}>Modifier</Button>}
            {canManage && trashed && (
              <Button upper={false} leftIcon={<Refresh2 size={17} />} loading={restore.isPending} onClick={() => restore.mutate([p.id], { onSuccess: () => toast.success("Produit restauré", p.name), onError: (e) => toast.error("Restauration impossible", getErrorMessage(e)) })}>Restaurer</Button>
            )}
            {canManage && !trashed && <Button variant="danger" upper={false} leftIcon={<Trash size={17} />} onClick={() => setConfirm("trash")}>Corbeille</Button>}
            {canPurge && trashed && <Button variant="danger" upper={false} leftIcon={<Trash size={17} />} onClick={() => { setConfirm("purge"); setPurgeText(""); }}>Supprimer définitivement</Button>}
          </>
        }
      />

      {trashed && (
        <Reveal>
          <div className="rounded-box border border-danger/30 bg-danger-50 px-5 py-4 text-[14px] text-danger">Ce produit est dans la corbeille depuis le {formatDate(p.deletedAt as string)} : il n&apos;est plus visible en boutique.</div>
        </Reveal>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Unités vendues" value={st?.units ?? 0} icon={<Chart2 size={22} variant="Bold" />} />
        <StatCard label="Chiffre d'affaires" value={st?.revenue ?? 0} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} tone="blue" delay={0.05} />
        {canManage && <StatCard label="Bénéfice généré" value={st?.profit ?? 0} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} tone="orange" delay={0.1} className="col-span-2 sm:col-span-1" />}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Reveal>
          <Block>
            <div className="relative aspect-square overflow-hidden rounded-box bg-page/50">
              {p.images[active] && <Image key={p.images[active]} src={p.images[active]} alt={p.name} fill sizes="(min-width:1024px) 40vw, 100vw" className="animate-fade-in object-cover" />}
            </div>
            {p.images.length > 1 && (
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                {p.images.map((src, i) => (
                  <button key={src} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`} className={cn("relative size-16 shrink-0 overflow-hidden rounded-md border-2 transition-all active:scale-95", i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}>
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Block>
        </Reveal>

        <div className="flex flex-col gap-4">
          <Reveal>
            <Block>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
                <h2 className="text-[18px]">Informations clés</h2>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button size="sm" variant="chip" upper={false} leftIcon={<Clock size={14} />} onClick={() => setHistory(true)}>Historique</Button>
                  {canStock && !trashed && <Button size="sm" upper={false} leftIcon={<ArrowSwapVertical size={14} />} onClick={() => setAdjust(true)}>Ajuster le stock</Button>}
                </div>
              </div>
              <dl className="mt-4 divide-y divide-line-3">
                {facts.map(([k, val]) => (
                  <div key={k} className="flex items-center justify-between gap-4 py-3 text-[14px]"><dt className="text-ink-2">{k}</dt><dd className="text-right font-semibold">{val}</dd></div>
                ))}
              </dl>
              {p.dateWish && canManage && (
                <p className={cn("mt-3 rounded-box px-4 py-3 text-[13px] leading-[20px]", dl.state === "overdue" ? "bg-danger-50 text-danger" : dl.state === "near" ? "bg-star/15 text-[#8a5a00]" : "bg-page/60 text-ink-2")}>
                  Produit ajouté depuis le {formatDate(p.dateAdded)}, il devrait être vendu avant le <strong>{formatDate(p.dateWish)}</strong>
                  {p.pricePrimary != null && <>. Il a été acheté à <strong>{formatPrice(p.pricePrimary)}</strong></>}.{" "}
                  <DeadlineBadge dateWish={p.dateWish} />
                </p>
              )}
            </Block>
          </Reveal>
          {p.features.length > 0 && (
            <Reveal delay={0.05}>
              <Block>
                <h2 className="text-[18px]">Caractéristiques</h2>
                <ul className="mt-4 flex flex-wrap gap-2">{p.features.map((f) => <li key={f} className="rounded-full bg-primary-50 px-3.5 py-1.5 text-[13px] font-medium text-primary-dark">{f}</li>)}</ul>
              </Block>
            </Reveal>
          )}
        </div>
      </div>

      {p.variants.length > 0 && (
        <Reveal>
          <Block>
            <h2 className="text-[18px]">Variantes <span className="text-ink-3">({p.variants.length})</span></h2>
            <ul className="mt-4 grid gap-2.5 sm:hidden">
              {p.variants.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 rounded-box border border-line p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold">{v.label}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-3">{v.sku ?? "—"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[14px] font-bold">{formatPrice(v.price ?? p.price)}</p>
                    <div className="mt-1"><StockPill product={{ stock: v.stock, stockThreshold: p.stockThreshold }} /></div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 hidden overflow-x-auto rounded-box border border-line sm:block">
              <table className="w-full min-w-[520px] text-[14px]">
                <thead className="bg-page/60 text-left text-[11px] uppercase tracking-wide text-ink-3">
                  <tr><th className="px-4 py-2.5">Variante</th><th className="px-4 py-2.5">SKU</th><th className="px-4 py-2.5 text-right">Prix</th><th className="px-4 py-2.5 text-right">Stock</th></tr>
                </thead>
                <tbody>
                  {p.variants.map((v) => (
                    <tr key={v.id} className="border-t border-line-3">
                      <td className="px-4 py-3 font-semibold">{v.label}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-ink-2">{v.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-right">{formatPrice(v.price ?? p.price)}{v.price != null && v.price !== p.price && <span className="ml-1 text-[11px] text-ink-3">(spécifique)</span>}</td>
                      <td className="px-4 py-3 text-right"><StockPill product={{ stock: v.stock, stockThreshold: p.stockThreshold }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Block>
        </Reveal>
      )}

      <Reveal>
        <Block>
          <h2 className="text-[18px]">Avis clients</h2>
          {totalR === 0 ? (
            <p className="mt-4 text-ink-3">Aucun avis pour le moment.</p>
          ) : (
            <div className="mt-5 grid gap-6 sm:grid-cols-[200px_1fr] sm:items-center">
              <div className="text-center">
                <p className="text-[44px] font-bold leading-none">{p.rating?.toFixed(1) ?? "—"}</p>
                <Stars rating={p.rating} count={p.reviewsCount} className="mt-2 justify-center" />
              </div>
              <ul className="space-y-2">
                {dist.map((d) => (
                  <li key={d.n} className="flex items-center gap-3 text-[13px]">
                    <span className="w-6 text-ink-2">{d.n}★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-page"><motion.span className="block h-full rounded-full bg-star" initial={{ width: 0 }} whileInView={{ width: `${totalR ? (d.c / totalR) * 100 : 0}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} /></span>
                    <span className="w-6 text-right text-ink-3">{d.c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Block>
      </Reveal>

      <ConfirmDialog
        open={confirm === "trash"}
        onClose={() => setConfirm(null)}
        loading={trash.isPending}
        title="Mettre ce produit à la corbeille ?"
        message={`« ${p.name} » ne sera plus visible en boutique. Vous pourrez le restaurer depuis la liste des produits (onglet Corbeille).`}
        confirmLabel="Mettre à la corbeille"
        onConfirm={() => trash.mutate([p.id], { onSuccess: () => { toast.success("Produit mis à la corbeille", p.name); router.push(ROUTES.admin.products); }, onError: (e) => toast.error("Action impossible", getErrorMessage(e)) })}
      />

      <Modal open={confirm === "purge"} onClose={() => setConfirm(null)} title="Suppression définitive" className="max-w-[460px]">
        <p className="text-[14px] leading-[22px] text-ink-2">« <strong>{p.name}</strong> » sera supprimé <strong className="text-danger">définitivement</strong>. Cette action est irréversible.</p>
        <div className="mt-4"><Input label="Tapez SUPPRIMER pour confirmer" value={purgeText} onChange={(e) => setPurgeText(e.target.value)} autoComplete="off" /></div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="chip" upper={false} onClick={() => setConfirm(null)}>Annuler</Button>
          <Button variant="danger" upper={false} disabled={purgeText !== "SUPPRIMER"} loading={purge.isPending} onClick={() => purge.mutate(p.id, { onSuccess: () => { toast.success("Produit supprimé définitivement"); router.push(ROUTES.admin.products); }, onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)) })}>Supprimer</Button>
        </div>
      </Modal>

      <StockAdjustModal product={adjust ? p : null} onClose={() => setAdjust(false)} />
      <StockHistoryDrawer product={history ? p : null} onClose={() => setHistory(false)} />
    </>
  );
}

export function ProductAdminDetailView({ id }: { id: number }) {
  return (
    <PermissionGuard permission="products.view">
      <Content id={id} />
    </PermissionGuard>
  );
}
