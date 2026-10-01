"use client";

import { Bag2, Chart2, MoneyRecive, ShoppingCart } from "iconsax-reactjs";
import { useState } from "react";
import { formatCompact, formatPrice } from "@/shared/lib/format";
import { Select } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import type { PaymentMethod } from "@/modules/orders/types";
import { AreaLineChart, BarChart, ChartCard, DonutChart, LegendDot } from "../../charts";
import { PAYMENT_LABELS } from "../../dashboard/types";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useAnalytics } from "../hooks/useAnalytics";
import { DEFAULT_FILTERS, RANGES, type AnalyticsFilters } from "../types";
import { Heatmap } from "./Heatmap";

const PALETTE = ["#1ABA1A", "#222222", "#FFA500", "#0D6EFD", "#F1352B", "#7E57C2", "#00A8A8", "#999999", "#E91E8C", "#8BC34A"];
const money = (n: number) => (n >= 1000 ? `$${formatCompact(n)}` : formatPrice(n).replace(".00", ""));

export function AnalyticsView() {
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const { data } = useAnalytics(filters);
  const { data: categories } = useCategories();
  const s = data?.summary;
  const set = (patch: Partial<AnalyticsFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <>
      <PageHeader title="Analytique" description="Analysez vos ventes, vos marges et les habitudes d'achat.">
        <div className="flex flex-wrap items-end gap-4">
          <Tabs variant="pill" tabs={RANGES} value={filters.range} onChange={(range) => set({ range })} />
          <Select
            label="Catégorie"
            wrapperClassName="w-[200px]"
            value={String(filters.category)}
            onChange={(e) => set({ category: e.target.value === "all" ? "all" : Number(e.target.value) })}
            options={[{ value: "all", label: "Toutes" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]}
          />
          <Select
            label="Paiement"
            wrapperClassName="w-[200px]"
            value={filters.method}
            onChange={(e) => set({ method: e.target.value as PaymentMethod | "all" })}
            options={[{ value: "all", label: "Tous" }, ...(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => ({ value: m, label: PAYMENT_LABELS[m] }))]}
          />
        </div>
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {s ? (
          <>
            <StatCard label="Chiffre d'affaires" value={s.revenue} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} delta={s.revenueDelta} />
            <StatCard label="Bénéfice net" value={s.profit} format={formatPrice} icon={<Chart2 size={22} variant="Bold" />} tone="orange" delta={s.profitDelta} delay={0.05} />
            <StatCard label="Nombre de ventes" value={s.sales} icon={<Bag2 size={22} variant="Bold" />} tone="dark" delta={s.salesDelta} delay={0.1} />
            <StatCard label="Panier moyen" value={s.avgBasket} format={formatPrice} icon={<ShoppingCart size={22} variant="Bold" />} tone="blue" delta={s.avgBasketDelta} delay={0.15} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[132px] rounded-box" />)
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Ventes par période" subtitle="Revenu (barres) et bénéfice (ligne)" className="xl:col-span-2" legend={<><LegendDot color="#1ABA1A" label="Revenu" /><LegendDot color="#222222" label="Bénéfice" /></>}>
          {data ? (
            <BarChart title="Ventes par période" format={money} lineLabel="Bénéfice" data={data.monthly.labels.map((l, i) => ({ label: l, value: data.monthly.revenue[i], line: data.monthly.profit[i] }))} />
          ) : (
            <Skeleton className="h-[280px] w-full" />
          )}
        </ChartCard>
        <ChartCard title="Par catégorie" subtitle="Part du chiffre d'affaires" delay={0.1}>
          {data ? (
            <DonutChart title="Répartition par catégorie" legendSide={false} size={180} centerLabel="Total" format={(n) => `$${formatCompact(n)}`} segments={data.byCategory.slice(0, 8).map((c, i) => ({ label: c.name, value: c.value, color: PALETTE[i % PALETTE.length] }))} />
          ) : (
            <Skeleton className="mx-auto h-[180px] w-[180px] rounded-full" />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Meilleures ventes" subtitle="Produits générant le plus de revenu">
          {data ? (
            <BarChart orientation="horizontal" title="Meilleures ventes" format={formatPrice} data={data.topProducts.slice(0, 6).map((p) => ({ label: p.name, value: p.revenue, image: p.image }))} />
          ) : (
            <div className="space-y-4">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
          )}
        </ChartCard>
        <ChartCard title="Marge par catégorie" subtitle="Taux de marge moyen (%)" delay={0.1}>
          {data ? (
            <BarChart orientation="horizontal" color="#FFA500" title="Marge par catégorie" format={(n) => `${n.toFixed(1)}%`} data={data.marginByCategory.slice(0, 7).map((m) => ({ label: m.name, value: m.margin }))} />
          ) : (
            <Skeleton className="h-[280px] w-full" />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Évolution du panier moyen" subtitle="Montant moyen par vente" legend={<LegendDot color="#0D6EFD" label="Panier moyen" />}>
          {data ? (
            <AreaLineChart title="Évolution du panier moyen" height={260} labels={data.basket.labels} format={money} series={[{ key: "basket", label: "Panier moyen", color: "#0D6EFD", data: data.basket.values }]} />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </ChartCard>
        <ChartCard title="Heures de pointe" subtitle="Nombre de ventes par jour et par heure" className="xl:col-span-2" delay={0.1}>
          {data ? <Heatmap data={data.heatmap} hours={data.heatmapHours} /> : <Skeleton className="h-[260px] w-full" />}
        </ChartCard>
      </div>
    </>
  );
}
