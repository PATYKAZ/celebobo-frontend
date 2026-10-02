"use client";

import { Calendar, Coin1, MoneyRecive, Wallet3 } from "iconsax-reactjs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatCompact, formatDate, formatPrice } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Drawer } from "@/shared/ui/Overlay";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useCan, PermissionGuard } from "@/modules/auth/hooks/useCan";
import { BarChart, ChartCard } from "../../charts";
import { DataTable, type Column } from "../../ui/DataTable";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { AVAILABILITY_DOT, AVAILABILITY_LABEL } from "../../resellers/types";
import { useCommissionPayments, useCommissions } from "../hooks/useCommissions";
import type { CommissionRow, CommissionsOverview } from "../types";
import { PayCommissionModal } from "./PayCommissionModal";
import { PaymentsList } from "./PaymentsList";

const money = (n: number) => (n >= 1000 ? `$${formatCompact(n)}` : formatPrice(n).replace(".00", ""));

export function CommissionsView() {
  return (
    <PermissionGuard permission="commissions.view.own">
      <CommissionsContent />
    </PermissionGuard>
  );
}

function Totals({ data }: { data?: CommissionsOverview }) {
  const t = data?.totals;
  const own = data?.scope === "own";
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {t ? (
        <>
          <StatCard label={`Gagné · ${data?.monthLabel}`} value={t.earnedMonth} format={formatPrice} icon={<Calendar size={22} variant="Bold" />} tone="blue" />
          <StatCard label={`Gagné · ${data?.asOfLabel.toLowerCase()}`} value={t.earned} format={formatPrice} icon={<Coin1 size={22} variant="Bold" />} tone="orange" delay={0.05} />
          <StatCard label={own ? "Déjà reçu" : "Déjà payé"} value={t.paid} format={formatPrice} icon={<MoneyRecive size={22} variant="Bold" />} delay={0.1} />
          <StatCard label={own ? "Qui vous est dû" : "Reste à payer"} value={t.due} format={formatPrice} icon={<Wallet3 size={22} variant="Bold" />} tone={t.due > 0 ? "red" : "green"} delay={0.15} />
        </>
      ) : (
        Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[132px] rounded-box" />)
      )}
    </section>
  );
}

function CommissionsContent() {
  const { data } = useCommissions();
  return data?.scope === "own" ? <OwnCommissions data={data} /> : <AllCommissions data={data} />;
}

/* ───────────────── Responsable / admin ───────────────── */

function AllCommissions({ data }: { data?: CommissionsOverview }) {
  const sp = useSearchParams();
  const canPay = useCan("commissions.pay");
  const [history, setHistory] = useState<number | null>(null);
  const [paying, setPaying] = useState<CommissionRow | null>(null);
  const { data: payments, isLoading: loadingPayments } = useCommissionPayments(history);
  const historyRow = data?.rows.find((r) => r.resellerId === history);

  useEffect(() => {
    const id = Number(sp.get("reseller"));
    if (id) setHistory(id);
  }, [sp]);

  const columns: Column<CommissionRow>[] = [
    {
      key: "n",
      header: "Revendeur",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="relative">
            <Avatar src={r.avatar} name={r.name} size={36} />
            <span title={AVAILABILITY_LABEL[r.availability]} className={cn("absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-white", AVAILABILITY_DOT[r.availability])} />
          </span>
          <div className="min-w-0"><p className="truncate font-semibold leading-[18px]">{r.name}</p>{!r.active && <p className="text-[11px] text-danger">Désactivé</p>}</div>
        </div>
      ),
    },
    { key: "rate", header: "Taux", align: "center", hideBelow: "md", cell: (r) => <span className="text-ink-2">{(r.rate * 100).toFixed(1)}%</span> },
    { key: "month", header: "Ce mois", align: "right", hideBelow: "lg", cell: (r) => <span className="text-ink-2">{formatPrice(r.earnedMonth)}</span> },
    { key: "earned", header: "Gagné (cumul)", align: "right", hideBelow: "sm", cell: (r) => <strong>{formatPrice(r.earned)}</strong> },
    { key: "paid", header: "Payé", align: "right", hideBelow: "md", cell: (r) => <span className="text-ink-2">{formatPrice(r.paid)}</span> },
    { key: "due", header: "Dû", align: "right", cell: (r) => <strong className={r.due > 0 ? "text-danger" : "text-primary"}>{formatPrice(r.due)}</strong> },
    { key: "last", header: "Dernier paiement", hideBelow: "xl", cell: (r) => <span className="text-ink-2">{r.lastPaymentAt ? formatDate(r.lastPaymentAt) : "—"}</span> },
    {
      key: "a",
      header: "",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="xs" variant="chip" upper={false} onClick={() => setHistory(r.resellerId)}>Historique</Button>
          {canPay && <Button size="xs" upper={false} disabled={r.due <= 0.005} onClick={() => setPaying(r)}>Payer</Button>}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Commissions" description={data ? `${data.asOfLabel} · mois en cours : ${data.monthLabel}` : "Commissions des revendeurs : gagnées, payées, restant dû."} />
      <Totals data={data} />
      <div className="overflow-hidden rounded-box bg-white">
        <DataTable columns={columns} rows={data?.rows} loading={!data} rowKey={(r) => r.resellerId} onRowClick={(r) => setHistory(r.resellerId)} skeletonRows={8} />
      </div>

      <Drawer open={history != null} onClose={() => setHistory(null)} title={historyRow ? `Paiements · ${historyRow.name}` : "Paiements"} side="right" className="max-w-[460px]">
        <div className="p-5">
          {historyRow && (
            <div className="mb-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-box bg-chip p-3"><p className="text-[11px] uppercase text-ink-3">Gagné</p><p className="font-bold">{formatPrice(historyRow.earned)}</p></div>
              <div className="rounded-box bg-chip p-3"><p className="text-[11px] uppercase text-ink-3">Payé</p><p className="font-bold">{formatPrice(historyRow.paid)}</p></div>
              <div className="rounded-box bg-primary-50 p-3"><p className="text-[11px] uppercase text-ink-3">Dû</p><p className="font-bold text-primary">{formatPrice(historyRow.due)}</p></div>
            </div>
          )}
          {loadingPayments ? <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : <PaymentsList payments={payments ?? []} />}
          {canPay && historyRow && historyRow.due > 0.005 && <Button className="mt-5" fullWidth upper={false} onClick={() => { setPaying(historyRow); }}>Enregistrer un paiement</Button>}
        </div>
      </Drawer>
      <PayCommissionModal row={paying} onClose={() => setPaying(null)} />
    </>
  );
}

/* ───────────────── Revendeur : ses propres commissions ───────────────── */

function OwnCommissions({ data }: { data: CommissionsOverview }) {
  const row = data.rows[0];
  return (
    <>
      <PageHeader title="Mes commissions" description={`${data.asOfLabel} · taux appliqué : ${(row.rate * 100).toFixed(1)} % de vos ventes validées`} />
      <Totals data={data} />
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Commissions gagnées par mois" subtitle="6 derniers mois (ventes validées × votre taux)" className="xl:col-span-2">
          {data.monthly ? <BarChart title="Commissions par mois" format={money} data={data.monthly.labels.map((l, i) => ({ label: l, value: data.monthly!.values[i] }))} /> : <Skeleton className="h-[260px] w-full" />}
        </ChartCard>
        <ChartCard title="Mes paiements" subtitle={`${data.payments?.length ?? 0} paiement(s) reçu(s)`} delay={0.1}>
          <PaymentsList payments={data.payments ?? []} />
        </ChartCard>
      </div>
    </>
  );
}
