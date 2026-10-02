"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight2, Crown, Messages2, Notification } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { formatCompact, formatDateTime, formatPrice, formatRelative } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StatusDot } from "@/shared/ui/Badges";
import { AreaLineChart, BarChart, ChartCard, DonutChart, LegendDot } from "../../charts";
import { DataTable, type Column } from "../../ui/DataTable";
import { PAYMENT_COLORS, PAYMENT_LABELS, type DashboardData, type DashboardSale } from "../types";

export function RevenueChart({ data }: { data?: DashboardData }) {
  return (
    <ChartCard
      title="Revenus & bénéfices"
      subtitle={data ? data.periodLabel : "Évolution du chiffre d'affaires et de la marge"}
      legend={<><LegendDot color="#1ABA1A" label="Revenu" /><LegendDot color="#FFA500" label="Bénéfice" /></>}
      className="xl:col-span-2"
    >
      {data ? (
        <AreaLineChart
          title="Revenus et bénéfices"
          labels={data.series.labels}
          format={(n) => (n >= 1000 ? `${formatCompact(n)}` : formatPrice(n).replace(".00", ""))}
          series={[
            { key: "revenue", label: "Revenu", color: "#1ABA1A", data: data.series.revenue },
            { key: "profit", label: "Bénéfice", color: "#FFA500", data: data.series.profit },
          ]}
        />
      ) : (
        <Skeleton className="h-[280px] w-full" />
      )}
    </ChartCard>
  );
}

export function MethodsDonut({ data }: { data?: DashboardData }) {
  return (
    <ChartCard title="Moyens de paiement" subtitle={data ? `Répartition du revenu · ${data.periodLabel}` : "Répartition du revenu"} delay={0.1}>
      {data ? (
        <DonutChart
          title="Répartition par moyen de paiement"
          centerLabel="Revenu total"
          format={(n) => `$${formatCompact(n)}`}
          legendSide={false}
          segments={data.methods.map((m) => ({ label: PAYMENT_LABELS[m.method], value: m.total, color: PAYMENT_COLORS[m.method] }))}
        />
      ) : (
        <Skeleton className="mx-auto h-[190px] w-[190px] rounded-full" />
      )}
    </ChartCard>
  );
}

export function TopProductsCard({ data }: { data?: DashboardData }) {
  return (
    <ChartCard title="Meilleures ventes" subtitle={data ? `Top 5 produits · ${data.periodLabel}` : "Top 5 produits sur la période"}>
      {data ? (
        <BarChart
          orientation="horizontal"
          title="Top 5 des produits"
          format={(n) => formatPrice(n)}
          data={data.topProducts.map((p) => ({ label: `${p.name} · ${p.units} ventes`, value: p.revenue, image: p.image }))}
        />
      ) : (
        <div className="space-y-4">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
      )}
    </ChartCard>
  );
}

export function RecentSalesTable({ data }: { data?: DashboardData }) {
  const columns: Column<DashboardSale>[] = [
    {
      key: "product",
      header: "Produit",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-page">{s.productImage && <Image src={s.productImage} alt="" fill sizes="40px" className="object-cover" />}</span>
          <span className="line-clamp-1 max-w-[220px] font-semibold">{s.productName}</span>
        </div>
      ),
    },
    { key: "buyer", header: "Vendu à", hideBelow: "md", cell: (s) => <span className="flex items-center gap-2"><Avatar name={s.buyer} size={26} />{s.buyer}</span> },
    { key: "seller", header: "Vendeur", hideBelow: "xl", cell: (s) => <span className="text-ink-2">{s.seller}</span> },
    { key: "method", header: "Paiement", hideBelow: "lg", cell: (s) => <span className="inline-flex items-center gap-1.5 text-[13px]"><span className="size-2 rounded-full" style={{ background: PAYMENT_COLORS[s.method] }} />{PAYMENT_LABELS[s.method]}</span> },
    { key: "date", header: "Date", hideBelow: "sm", cell: (s) => <span className="text-ink-2">{formatDateTime(s.date)}</span> },
    { key: "price", header: "Montant", align: "right", cell: (s) => <strong>{formatPrice(s.priceFinal)}</strong> },
  ];
  return (
    <ChartCard title="Ventes récentes" subtitle="Dernières transactions enregistrées" className="xl:col-span-2" legend={<Link href={ROUTES.admin.sales} className="group inline-flex min-h-10 items-center gap-1 text-[13px] font-semibold text-primary">Tout voir <ArrowRight2 size={13} className="transition-transform group-hover:translate-x-1" /></Link>}>
      <div className="-mx-5 -mb-5 sm:-mx-[26px] sm:-mb-[26px]">
        <DataTable columns={columns} rows={data?.recentSales} loading={!data} rowKey={(s) => s.id} skeletonRows={5} />
      </div>
    </ChartCard>
  );
}

export function PendingOrdersCard({ data }: { data?: DashboardData }) {
  return (
    <ChartCard
      title="Commandes en attente"
      subtitle={data ? `${data.kpis.pendingOrders} en attente · ${data.kpis.unassignedOrders} non assignée${data.kpis.unassignedOrders > 1 ? "s" : ""}` : "Discussions à traiter"}
      delay={0.1}
      legend={<Link href={ROUTES.admin.notifications} aria-label="Notifications" className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white"><Notification size={17} variant="Bold" /></Link>}
    >
      {!data ? (
        <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : data.pendingOrders.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-ink-3">Aucune commande en attente 🎉</p>
      ) : (
        <>
          <RevealGroup stagger={0.07} className="flex flex-col gap-2.5">
            {data.pendingOrders.map((o) => (
              <RevealItem key={o.id}>
                <Link href={o.conversationId ? ROUTES.admin.conversation(o.conversationId) : ROUTES.admin.orders} className="group flex items-center gap-3 rounded-box border border-line-3 p-3 transition-colors hover:border-primary hover:bg-primary-50">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-star/15 text-[#b87400]"><Messages2 size={18} variant="Bold" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold leading-[18px]">Commande #{o.id} · {o.buyer}</span>
                    <span className="text-[12px] text-ink-3">{o.itemsCount} article{o.itemsCount > 1 ? "s" : ""} · {formatRelative(o.createdAt)} · {o.assignedTo ?? "non assignée"}</span>
                  </span>
                  <span className="text-right"><strong className="block text-[14px]">{formatPrice(o.total)}</strong><StatusDot tone="orange">En attente</StatusDot></span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
          <Link href={ROUTES.admin.orders} className="mt-4 block rounded-box bg-primary-50 py-2.5 text-center text-[13px] font-bold text-primary transition-colors hover:bg-primary hover:text-white">Gérer les commandes</Link>
        </>
      )}
    </ChartCard>
  );
}

export function TopResellerCard({ data }: { data?: DashboardData }) {
  const t = data?.topReseller;
  return (
    <ChartCard title="Meilleur revendeur" subtitle={data ? data.periodLabel : "Sur la période"} delay={0.1}>
      {!data ? (
        <Skeleton className="h-[120px] w-full" />
      ) : !t || t.revenue === 0 ? (
        <p className="py-8 text-center text-[14px] text-ink-3">Aucune vente de revendeur sur la période.</p>
      ) : (
        <div className="flex flex-col items-center gap-3 py-3 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-star/15 text-[#b87400]"><Crown size={32} variant="Bold" /></span>
          <p className="text-[18px] font-bold leading-[24px]">{t.name}</p>
          <p className="text-[28px] font-bold leading-[34px] text-primary">{formatPrice(t.revenue)}</p>
          <Link href={`${ROUTES.admin.resellers}?period=${data.periodKey}`} className="group inline-flex min-h-10 items-center gap-1 text-[13px] font-semibold text-primary">
            Voir le classement <ArrowRight2 size={13} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </ChartCard>
  );
}
