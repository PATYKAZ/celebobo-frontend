"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Clock } from "iconsax-reactjs";
import { formatCompact, formatPrice } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Pill } from "@/shared/ui/Badges";
import { ChartCard } from "../../charts";
import { DataTable, type Column } from "../../ui/DataTable";
import type { AnalyticsData, ResellerPerformance, ResellerPerformanceRow, SlowMover } from "../types";

const money = (n: number) => (n >= 1000 ? `$${formatCompact(n)}` : formatPrice(n).replace(".00", ""));

/** Produits en stock sans vente récente. */
export function SlowMoversCard({ data }: { data?: AnalyticsData }) {
  const columns: Column<SlowMover>[] = [
    {
      key: "p",
      header: "Produit",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-page">{r.image && <Image src={r.image} alt="" fill sizes="40px" className="object-cover" />}</span>
          <p className="line-clamp-1 max-w-[220px] min-w-0 font-semibold leading-[18px]">{r.name}</p>
        </div>
      ),
    },
    { key: "stock", header: "Stock", align: "center", hideBelow: "sm", cell: (r) => <strong>{r.stock}</strong> },
    {
      key: "last",
      header: "Dernière vente",
      hideBelow: "sm",
      cell: (r) => (r.daysSinceLastSale == null ? <span className="text-danger">Jamais vendu</span> : <span className="text-ink-2">il y a {r.daysSinceLastSale} j</span>),
    },
    { key: "why", header: "Alerte", cell: () => <Pill tone="yellow"><Clock size={11} className="mr-1" />Rotation lente</Pill> },
  ];
  return (
    <ChartCard
      title="Produits à rotation lente"
      subtitle={data ? `${data.slowMovers.total} produit(s) en stock sans vente récente` : "Stock immobilisé"}
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

/** Classement des vendeurs : ventes, part du chiffre d'affaires, bénéfice. */
export function ResellerPerformanceCard({ perf }: { perf?: ResellerPerformance }) {
  const rows = perf?.rows ?? [];
  const maxRev = Math.max(1, ...rows.map((r) => r.revenue));
  const columns: Column<ResellerPerformanceRow>[] = [
    {
      key: "n",
      header: "Vendeur",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar src={null} name={r.name} size={34} />
          <span className="block min-w-0 truncate font-semibold leading-[18px]">{r.name}</span>
        </div>
      ),
    },
    { key: "s", header: "Ventes", align: "center", hideBelow: "sm", cell: (r) => <span><strong>{r.salesCount}</strong><span className="text-ink-3"> · {r.units} u.</span></span> },
    { key: "p", header: "Part du CA", hideBelow: "md", cell: (r) => <DataBar value={r.share} max={100} color="#1ABA1A" label={`${r.share.toFixed(0)}%`} /> },
    { key: "b", header: "Bénéfice", align: "right", hideBelow: "lg", cell: (r) => <strong>{money(r.profit)}</strong> },
    { key: "r", header: "Chiffre d'affaires", align: "right", cell: (r) => <div className="min-w-[150px]"><DataBar value={r.revenue} max={maxRev} color="#0D6EFD" label={money(r.revenue)} /></div> },
  ];
  return (
    <ChartCard title="Performance par vendeur" subtitle={perf ? perf.periodLabel : "Ventes, part du chiffre d'affaires, bénéfice"} className="xl:col-span-3">
      <div className="-mx-5 -mb-5 sm:-mx-[26px] sm:-mb-[26px]">
        <DataTable columns={columns} rows={perf?.rows.slice(0, 12)} loading={!perf} rowKey={(r) => r.id} skeletonRows={6} />
      </div>
      {perf && perf.rows.length > 12 && <p className="mt-6 text-center text-[12px] text-ink-3">Top 12 sur {perf.rows.length} vendeurs.</p>}
    </ChartCard>
  );
}
