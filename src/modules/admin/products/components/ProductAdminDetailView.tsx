"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { Chart2, Edit2, MoneyRecive, Shop, Trash } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Pill } from "@/shared/ui/Badges";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Stars } from "@/shared/ui/Stars";
import { toast } from "@/shared/ui/Toast";
import { Reveal } from "@/shared/animations/Reveal";
import { useProductReviews } from "@/modules/products/hooks/useProducts";
import { getPricing } from "@/modules/products/utils";
import { useSales } from "../../sales/hooks/useSales";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useAdminProduct, useDeleteProduct } from "../hooks/useAdminProducts";

export function ProductAdminDetailView({ id }: { id: number }) {
  const router = useRouter();
  const { data: p, isLoading, isError } = useAdminProduct(id);
  const { data: sales } = useSales({ productId: id, pageSize: 1 });
  const { data: reviews } = useProductReviews(id);
  const remove = useDeleteProduct();
  const [active, setActive] = useState(0);
  const [confirm, setConfirm] = useState(false);

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
  const st = sales?.stats;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews?.filter((r) => r.rating === n).length ?? 0 }));
  const totalR = reviews?.length ?? 0;

  const facts: [string, React.ReactNode][] = [
    ["Catégorie", p.category],
    ["Prix de vente", <span key="p" className={cn("font-bold", pr.onSale && "text-danger")}>{formatPrice(pr.current)}{pr.original && <span className="ml-2 font-normal text-ink-3 line-through">{formatPrice(pr.original)}</span>}</span>],
    ["Prix d'achat", p.pricePrimary != null ? formatPrice(p.pricePrimary) : "—"],
    ["Marge unitaire", p.pricePrimary != null ? formatPrice(pr.current - p.pricePrimary) : "—"],
    ["Stock", p.inStock ? <Pill key="s" tone="green">En stock</Pill> : <Pill key="s" tone="red">Rupture</Pill>],
    ["Livraison", p.freeShipping ? "Offerte" : p.shippingFee != null ? formatPrice(p.shippingFee) : "—"],
    ["Badge", p.currentBadge || "—"],
    ["Ajouté le", formatDate(p.dateAdded)],
  ];

  return (
    <>
      <PageHeader
        title={p.name}
        description={p.description}
        actions={
          <>
            <Button href={ROUTES.product(p.id)} variant="chip" upper={false} leftIcon={<Shop size={17} />}>Voir en boutique</Button>
            <Button href={ROUTES.admin.productEdit(p.id)} upper={false} leftIcon={<Edit2 size={17} />}>Modifier</Button>
            <Button variant="danger" upper={false} leftIcon={<Trash size={17} />} onClick={() => setConfirm(true)}>Supprimer</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Unités vendues" value={st?.count ?? 0} icon={<Chart2 size={22} variant="Bold" />} />
        <StatCard label="Chiffre d'affaires" value={st?.revenue ?? 0} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} tone="blue" delay={0.05} />
        <StatCard label="Bénéfice généré" value={st?.profit ?? 0} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} tone="orange" delay={0.1} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Reveal>
          <Block>
            <div className="relative aspect-square overflow-hidden rounded-box bg-page/50">
              {p.images[active] && <Image key={p.images[active]} src={p.images[active]} alt={p.name} fill sizes="(min-width:1024px) 40vw, 100vw" className="animate-fade-in object-cover" />}
            </div>
            {p.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {p.images.map((src, i) => (
                  <button key={src} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`} className={cn("relative size-16 overflow-hidden rounded-md border-2 transition-all", i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}>
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
              <h2 className="text-[18px]">Informations clés</h2>
              <dl className="mt-4 divide-y divide-line-3">
                {facts.map(([k, val]) => (
                  <div key={k} className="flex items-center justify-between gap-4 py-3 text-[14px]"><dt className="text-ink-2">{k}</dt><dd className="text-right font-semibold">{val}</dd></div>
                ))}
              </dl>
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
        open={confirm}
        onClose={() => setConfirm(false)}
        loading={remove.isPending}
        title="Supprimer ce produit ?"
        message={`« ${p.name} » sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        onConfirm={() =>
          remove.mutate(p.id, {
            onSuccess: () => {
              toast.success("Produit supprimé");
              router.push(ROUTES.admin.products);
            },
            onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
          })
        }
      />
    </>
  );
}
