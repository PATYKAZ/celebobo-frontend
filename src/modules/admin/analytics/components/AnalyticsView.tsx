"use client";

import { Bag2, Chart2, MoneyRecive, ShoppingCart } from "iconsax-reactjs";
import { useState } from "react";
import { formatCompact, formatPrice } from "@/shared/lib/format";
import { Select } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import type { PaymentMethod } from "@/modules/orders/types";
import { AreaLineChart, BarChart, ChartCard, DonutChart, LegendDot } from "../../charts";
import { PAYMENT_LABELS } from "../../dashboard/types";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useAnalytics, useResellerPerformance } from "../hooks/useAnalytics";
import { DEFAULT_FILTERS, RANGES, type AnalyticsFilters } from "../types";
import { Heatmap } from "./Heatmap";
import { ResellerPerformanceCard, SlowMoversCard, StockValueCard } from "./InsightsSections";

const PALETTE = ["#1ABA1A", "#222222", "#FFA500", "#0D6EFD", "#F1352B", "#7E57C2", "#00A8A8", "#999999", "#E91E8C", "#8BC34A"];
const money = (n: number) => (n >= 1000 ? `$${formatCompact(n)}` : formatPrice(n).replace(".00", ""));

export function AnalyticsView() {
  return (
    <PermissionGuard permission="analytics.view">
      <AnalyticsContent />
    </PermissionGuard>
  );
}

function AnalyticsContent() {
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const { data } = useAnalytics(filters);
  const canPerf = useCan("analytics.resellers");
  const { data: perf } = useResellerPerformance(filters.range, canPerf);
  const { data: categories } = useCategories();
  const s = data?.summary;
  const rangeLabel = RANGES.find((r) => r.value === filters.range)?.label.toLowerCase() ?? "";
  const set = (patch: Partial<AnalyticsFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <>
      <PageHeader title="Analytique" description={data ? `Période analysée : ${data.periodLabel} · comparée à ${data.previousPeriodLabel}` : "Analysez vos ventes, vos marges et les habitudes d'achat."}>
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
            <StatCard label={`Chiffre d'affaires · ${rangeLabel}`} value={s.revenue} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} delta={s.revenueDelta} deltaLabel="vs période préc." />
            <StatCard label={`Bénéfice net · ${rangeLabel}`} value={s.profit} format={formatPrice} icon={<Chart2 size={22} variant="Bold" />} tone="orange" delta={s.profitDelta} deltaLabel="vs période préc." delay={0.05} />
            <StatCard label={`Ventes · ${rangeLabel}`} value={s.sales} icon={<Bag2 size={22} variant="Bold" />} tone="dark" delta={s.salesDelta} deltaLabel="vs période préc." delay={0.1} />
            <StatCard label={`Panier moyen · ${rangeLabel}`} value={s.avgBasket} format={formatPrice} icon={<ShoppingCart size={22} variant="Bold" />} tone="blue" delta={s.avgBasketDelta} deltaLabel="vs période préc." delay={0.15} />
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

      <div className="grid gap-4 xl:grid-cols-3">
        <StockValueCard data={data} />
        <div className="rounded-box bg-white p-6 sm:p-[26px]">
          <h2 className="text-[18px] font-bold leading-[21.6px]">Stock actuel</h2>
          <p className="mt-1 text-[13px] text-ink-3">Valeur au prix d&apos;achat</p>
          <p className="mt-4 text-[30px] font-bold leading-[36px] text-primary">{data ? formatPrice(data.stockValue.current) : "—"}</p>
          <p className="mt-3 text-[13px] leading-[20px] text-ink-2">Reconstruite à partir des mouvements de stock (inventaires, ventes, retours, corrections).</p>
        </div>
        <SlowMoversCard data={data} />
        {canPerf && <ResellerPerformanceCard perf={perf} />}
      </div>
    </>
  );
}
