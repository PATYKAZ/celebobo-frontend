"use client";

import { Bag2, Calendar, Chart2, Clock, DocumentDownload, MoneyRecive, ShoppingCart, TrendUp } from "iconsax-reactjs";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { getErrorMessage } from "@/shared/lib/api";
import { toast } from "@/shared/ui/Toast";
import { formatPrice } from "@/shared/lib/format";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { PERIOD_TITLE } from "../lib/period";
import { useDashboard } from "../hooks/useDashboard";
import { dashboardService } from "../services/dashboard.service";
import { PERIODS, type DashboardPeriod } from "../types";
import { MethodsDonut, PendingOrdersCard, RecentSalesTable, RevenueChart, TopProductsCard, TopResellerCard } from "./DashboardSections";

const hello = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
};

export function DashboardView() {
  return (
    <PermissionGuard permission="dashboard.all">
      <DashboardContent />
    </PermissionGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const { data } = useDashboard(period);
  const k = data?.kpis;
  const p = PERIOD_TITLE[period];
  const vs = "vs période précédente";

  const [exporting, setExporting] = useState(false);
  const exportPdf = () => {
    setExporting(true);
    dashboardService
      .downloadReport(period)
      .catch((e) => toast.error("Export PDF impossible", getErrorMessage(e)))
      .finally(() => setExporting(false));
  };

  return (
    <>
      <PageHeader
        title={`${hello()}, ${user?.firstName || "équipe"} 👋`}
        description={data ? `Activité de Celebobo · ${data.periodLabel}` : "Voici l'activité de Celebobo : ventes, marges et commandes à traiter."}
        actions={<Button variant="dark" size="md" leftIcon={<DocumentDownload size={18} />} loading={exporting} onClick={exportPdf}>Exporter PDF</Button>}
      >
        <Tabs variant="pill" tabs={PERIODS} value={period} onChange={setPeriod} />
      </PageHeader>

      <section aria-label="Indicateurs clés" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        {k ? (
          <>
            <StatCard label={`Revenu · ${p}`} value={k.revenue} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} delta={k.revenueDelta} deltaLabel={vs} />
            <StatCard label={`Bénéfice · ${p}`} value={k.profit} format={formatPrice} icon={<TrendUp size={22} variant="Bold" />} tone="orange" delta={k.profitDelta} deltaLabel={vs} delay={0.05} />
            <StatCard label="Revenu · aujourd'hui" value={k.dayRevenue} format={formatPrice} icon={<Calendar size={22} variant="Bold" />} tone="blue" delay={0.1} />
            <StatCard label={`Ventes · ${p}`} value={k.sales} icon={<Bag2 size={22} variant="Bold" />} tone="dark" delta={k.salesDelta} deltaLabel={vs} delay={0.15} />
            <StatCard label={`Panier moyen · ${p}`} value={k.avgBasket} format={formatPrice} icon={<ShoppingCart size={22} variant="Bold" />} delta={k.avgBasketDelta} deltaLabel={vs} delay={0.2} />
            <StatCard label="Commandes en cours (actuel)" value={k.openOrders} icon={<Clock size={22} variant="Bold" />} tone="red" delay={0.25} />
          </>
        ) : (
          Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[132px] rounded-box" />)
        )}
      </section>

      <div className="grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-3">
        <RevenueChart data={data} />
        <MethodsDonut data={data} />
      </div>
      <div className="grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-3">
        <RecentSalesTable data={data} />
        <PendingOrdersCard data={data} />
      </div>
      <div className="grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-3">
        <TopProductsCard data={data} />
        <TopResellerCard data={data} />
        <div className="flex items-center justify-center rounded-box bg-primary p-8 text-white">
          <div className="max-w-[420px] text-center">
            <Chart2 size={44} variant="Bulk" className="mx-auto animate-float" />
            <h3 className="mt-3 text-[22px] leading-[28px]">Plongez dans l&apos;analytique</h3>
            <p className="mt-2 text-[14px] leading-[22px] text-white/85">Valeur du stock, rotation lente, performance des revendeurs, heures de pointe…</p>
            <Button href={ROUTES.admin.analytics} variant="white" className="mt-5">Voir l&apos;analytique</Button>
          </div>
        </div>
      </div>
    </>
  );
}
