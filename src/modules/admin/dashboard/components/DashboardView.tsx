"use client";

import { Bag2, Calendar, Chart2, Clock, DocumentDownload, Mobile, MoneyRecive, TrendUp } from "iconsax-reactjs";
import { useState } from "react";
import { env } from "@/config/env";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { formatPrice } from "@/shared/lib/format";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useDashboard } from "../hooks/useDashboard";
import { dashboardService } from "../services/dashboard.service";
import type { DashboardPeriod } from "../types";
import { MethodsDonut, PendingOrdersCard, RecentSalesTable, RevenueChart, TopProductsCard } from "./DashboardSections";

const hello = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
};

export function DashboardView() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const { data } = useDashboard(period);
  const k = data?.kpis;

  const exportPdf = () => {
    if (env.USE_MOCKS) return toast.info("Export PDF", "Disponible une fois l'API branchée.");
    window.open(dashboardService.pdfUrl(period), "_blank");
  };

  return (
    <>
      <PageHeader
        title={`${hello()}, ${user?.firstName || "équipe"} 👋`}
        description="Voici l'activité de Celebobo : ventes, marges et commandes à traiter."
        actions={<Button variant="dark" size="md" leftIcon={<DocumentDownload size={18} />} onClick={exportPdf}>Exporter PDF</Button>}
      />

      <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {k ? (
          <>
            <StatCard label="Revenu du mois" value={k.monthRevenue} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} delta={k.monthRevenueDelta} deltaLabel="vs mois dernier" />
            <StatCard label="Bénéfice" value={k.profit} format={formatPrice} icon={<TrendUp size={22} variant="Bold" />} tone="orange" delta={k.profitDelta} deltaLabel="vs mois dernier" delay={0.05} />
            <StatCard label="Revenu du jour" value={k.dayRevenue} format={formatPrice} icon={<Calendar size={22} variant="Bold" />} tone="blue" delta={k.dayRevenueDelta} deltaLabel="vs hier" delay={0.1} />
            <StatCard label="Ventes du mois" value={k.monthSales} icon={<Bag2 size={22} variant="Bold" />} tone="dark" delta={k.monthSalesDelta} deltaLabel="vs mois dernier" delay={0.15} />
            <StatCard label="Part smartphones" value={k.smartphonesShare} format={(n) => `${n.toFixed(1)}%`} icon={<Mobile size={22} variant="Bold" />} delta={k.smartphonesDelta} deltaLabel="vs mois dernier" delay={0.2} />
            <StatCard label="Commandes en attente" value={k.pendingOrders} icon={<Clock size={22} variant="Bold" />} tone="red" delay={0.25} />
          </>
        ) : (
          Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[132px] rounded-box" />)
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <RevenueChart data={data} period={period} onPeriod={setPeriod} />
        <MethodsDonut data={data} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <RecentSalesTable data={data} />
        <PendingOrdersCard data={data} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <TopProductsCard data={data} />
        <div className="hidden items-center justify-center rounded-box bg-primary p-8 text-white xl:col-span-2 xl:flex">
          <div className="max-w-[420px] text-center">
            <Chart2 size={44} variant="Bulk" className="mx-auto animate-float" />
            <h3 className="mt-3 text-[22px] leading-[28px]">Plongez dans l&apos;analytique</h3>
            <p className="mt-2 text-[14px] leading-[22px] text-white/85">Marges par catégorie, heures de pointe, panier moyen… tout est dans la page Analytique.</p>
            <Button href="/admin/analytique" variant="white" className="mt-5">Voir l&apos;analytique</Button>
          </div>
        </div>
      </div>
    </>
  );
}
