"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Clock, Warning2 } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatCompact, formatDate, formatPrice } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Pill } from "@/shared/ui/Badges";
import { Skeleton } from "@/shared/ui/Skeleton";
import { AreaLineChart, ChartCard, LegendDot } from "../../charts";
import { DataTable, type Column } from "../../ui/DataTable";
import { AVAILABILITY_DOT, AVAILABILITY_LABEL } from "../../resellers/types";
import type { AnalyticsData, ResellerPerformance, ResellerPerformanceRow, SlowMover } from "../types";

const money = (n: number) => (n >= 1000 ? `$${formatCompact(n)}` : formatPrice(n).replace(".00", ""));

/** Valeur du stock (prix d'achat) dans le temps. */
export function StockValueCard({ data }: { data?: AnalyticsData }) {
  const s = data?.stockValue;
  const delta = s && s.first > 0 ? ((s.current - s.first) / s.first) * 100 : null;
  return (
    <ChartCard
      title="Valeur du stock dans le temps"
      subtitle={s ? `${s.label} · valeur au prix d'achat` : "Valeur au prix d'achat"}
      legend={<LegendDot color="#0D6EFD" label="Valeur du stock" />}
      className="xl:col-span-2"
    >
      {s ? (
        <>
          <p className="mb-3 text-[14px] text-ink-2">
            Valeur actuelle : <strong className="text-[18px] text-ink">{formatPrice(s.current)}</strong>
            {delta != null && <span className={cn("ml-2 font-semibold", delta >= 0 ? "text-primary" : "text-danger")}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}% sur la période</span>}
          </p>
          <AreaLineChart title="Valeur du stock" height={260} labels={s.labels} format={money} series={[{ key: "stock", label: "Valeur du stock", color: "#0D6EFD", data: s.values }]} />
        </>
      ) : (
        <Skeleton className="h-[300px] w-full" />
      )}
    </ChartCard>
  );
}

/** Produits à rotation lente / proches de leur date « à vendre avant le ». */
export function SlowMoversCard({ data }: { data?: AnalyticsData }) {
  const columns: Column<SlowMover>[] = [
    {
      key: "p",
      header: "Produit",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-page">{r.image && <Image src={r.image} alt="" fill sizes="40px" className="object-cover" />}</span>
          <div className="min-w-0">
            <p className="line-clamp-1 max-w-[220px] font-semibold leading-[18px]">{r.name}</p>
            <p className="text-[12px] text-ink-3">{r.category}</p>
          </div>
        </div>
      ),
    },
    { key: "stock", header: "Stock", align: "center", hideBelow: "sm", cell: (r) => <strong>{r.stock}</strong> },
    { key: "value", header: "Valeur stock", align: "right", hideBelow: "md", cell: (r) => <strong>{formatPrice(r.stockValue)}</strong> },
    {
      key: "last",
      header: "Dernière vente",
      hideBelow: "sm",
      cell: (r) => (r.daysSinceLastSale == null ? <span className="text-danger">Jamais vendu</span> : <span className="text-ink-2">il y a {r.daysSinceLastSale} j · {r.unitsSold60d} u. / 60 j</span>),
    },
    {
      key: "why",
      header: "Alerte",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.reasons.includes("rotation") && <Pill tone="yellow"><Clock size={11} className="mr-1" />Rotation lente</Pill>}
          {r.reasons.includes("echeance") && (
            <Pill tone="red">
              <Warning2 size={11} className="mr-1" />
              {r.dateWishDays != null && r.dateWishDays < 0 ? `Dépassé de ${-r.dateWishDays} j` : `À vendre avant le ${formatDate(r.dateWish as string)}`}
            </Pill>
          )}
        </div>
      ),
    },
  ];
  return (
    <ChartCard
      title="Produits à rotation lente"
      subtitle={data ? `${data.slowMovers.total} produit(s) · aucune/peu de ventes sur 45–60 j ou échéance « à vendre avant le » ≤ 14 j` : "Stock immobilisé"}
      className="xl:col-span-3"
    >
      <div className="-mx-5 -mb-5 sm:-mx-[26px] sm:-mb-[26px]">
        <DataTable columns={columns} rows={data?.slowMovers.rows} loading={!data} rowKey={(r) => r.id} skeletonRows={5} empty={<p className="py-12 text-center text-[14px] text-ink-3">Aucun produit à rotation lente. 🎉</p>} />
      </div>
    </ChartCard>
  );
}

function DataBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-2 min-w-[70px] flex-1 overflow-hidden rounded-full bg-chip">
        <motion.span initial={{ width: 0 }} whileInView={{ width: `${max > 0 ? Math.max(3, (value / max) * 100) : 0}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="block h-full rounded-full" style={{ background: color }} />
      </span>
      <span className="w-[64px] text-right text-[13px] font-semibold tabular-nums">{label}</span>
    </div>
  );
}

/** Performance par revendeur : délai de réponse, conversion commande → vente, chiffre d'affaires, commandes traitées. */
export function ResellerPerformanceCard({ perf }: { perf?: ResellerPerformance }) {
  const rows = perf?.rows ?? [];
  const maxRev = Math.max(1, ...rows.map((r) => r.revenue));
  const maxResp = Math.max(1, ...rows.map((r) => r.avgResponseMinutes));
  const columns: Column<ResellerPerformanceRow>[] = [
    {
      key: "n",
      header: "Revendeur",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="relative">
            <Avatar src={r.avatar} name={r.name} size={34} />
            <span title={AVAILABILITY_LABEL[r.availability]} className={cn("absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-white", AVAILABILITY_DOT[r.availability])} />
          </span>
          <span className="min-w-0"><span className="block truncate font-semibold leading-[18px]">{r.name}</span>{!r.active && <span className="text-[11px] text-danger">Désactivé</span>}</span>
        </div>
      ),
    },
    { key: "o", header: "Commandes", align: "center", hideBelow: "sm", cell: (r) => <span><strong>{r.ordersDelivered}</strong><span className="text-ink-3"> / {r.ordersAssigned} livrées</span></span> },
    { key: "c", header: "Conversion", hideBelow: "md", cell: (r) => <DataBar value={r.conversionRate} max={100} color="#1ABA1A" label={`${r.conversionRate.toFixed(0)}%`} /> },
    { key: "t", header: "Délai de réponse", hideBelow: "lg", cell: (r) => <DataBar value={r.avgResponseMinutes} max={maxResp} color={r.avgResponseMinutes <= 12 ? "#1ABA1A" : r.avgResponseMinutes <= 20 ? "#FFA500" : "#F1352B"} label={`${r.avgResponseMinutes} min`} /> },
    { key: "r", header: "Chiffre d'affaires", align: "right", cell: (r) => <div className="min-w-[150px]"><DataBar value={r.revenue} max={maxRev} color="#0D6EFD" label={money(r.revenue)} /></div> },
  ];
  return (
    <ChartCard title="Performance par revendeur" subtitle={perf ? perf.periodLabel : "Délai de réponse, conversion, chiffre d'affaires"} className="xl:col-span-3">
      <div className="-mx-5 -mb-5 sm:-mx-[26px] sm:-mb-[26px]">
        <DataTable columns={columns} rows={perf?.rows.slice(0, 12)} loading={!perf} rowKey={(r) => r.id} skeletonRows={6} />
      </div>
      {perf && perf.rows.length > 12 && <p className="mt-6 text-center text-[12px] text-ink-3">Top 12 sur {perf.rows.length} revendeurs.</p>}
    </ChartCard>
  );
}
