"use client";

import { Coin1, MoneyRecive, Timer1, Wallet3 } from "@/shared/ui/icons";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatMoneyCompact, formatDate, formatPrice } from "@/shared/lib/format";
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
import { useCommissionPayments, useCommissions, useStatements } from "../hooks/useCommissions";
import { COMMISSION_RULES_SUMMARY, type CommissionRow, type CommissionsOverview, type PayoutStatement } from "../types";
import { PaymentsList } from "./PaymentsList";
import { PayStatementModal } from "./PayStatementModal";
import { StatementDrawer } from "./StatementDrawer";
import { payoutDay, StatementsList } from "./StatementsList";

const money = formatMoneyCompact;

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
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {t ? (
        <>
          <StatCard label="En attente (7 jours après livraison)" value={t.pending} format={formatPrice} icon={<Timer1 size={22} variant="Bold" />} tone="blue" />
          <StatCard label="Validé (cumul)" value={t.validated} format={formatPrice} icon={<Coin1 size={22} variant="Bold" />} tone="orange" delay={0.05} />
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

/** Relevé ouvert : `?releve=` (lien des notifications) ou un clic dans une liste. */
function useOpenStatement() {
  const sp = useSearchParams();
  const [open, setOpen] = useState<number | null>(() => Number(sp.get("releve")) || null);
  return [open, setOpen] as const;
}

const nextPayoutLabel = (row?: CommissionRow) =>
  row ? `Prochain paiement le ${payoutDay(row.nextPayoutDate)} (dès ${formatPrice(row.threshold)}, sinon reporté)` : "Paiements le 1er et le 16 de chaque mois";

/* ───────────────── Responsable / admin ───────────────── */

function AllCommissions({ data }: { data?: CommissionsOverview }) {
  const sp = useSearchParams();
  const canPay = useCan("commissions.pay");
  const [history, setHistory] = useState<number | null>(null);
  const [paying, setPaying] = useState<PayoutStatement | null>(null);
  const [statement, setStatement] = useOpenStatement();
  const { data: payments, isLoading: loadingPayments } = useCommissionPayments(history);
  const { data: toPay } = useStatements(null, "prepared");
  const { data: resellerStatements } = useStatements(history, undefined, history != null);
  const historyRow = data?.rows.find((r) => r.resellerId === history);
  const toPayTotal = (toPay ?? []).reduce((n, s) => n + s.total, 0);

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
            <span title={AVAILABILITY_LABEL[r.availability]} className={cn("absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-surface", AVAILABILITY_DOT[r.availability])} />
          </span>
          <div className="min-w-0"><p className="truncate font-semibold">{r.name}</p>{!r.active && <p className="text-xs text-danger">Désactivé</p>}</div>
        </div>
      ),
    },
    { key: "pending", header: "En attente", align: "right", hideBelow: "lg", cell: (r) => <span className="text-ink-2">{formatPrice(r.pending)}</span> },
    { key: "validated", header: "Validé", align: "right", hideBelow: "sm", cell: (r) => <strong>{formatPrice(r.validated)}</strong> },
    { key: "fees", header: "Livraisons", align: "right", hideBelow: "xl", cell: (r) => <span className="text-ink-2">{formatPrice(r.deliveryFees)}</span> },
    { key: "paid", header: "Payé", align: "right", hideBelow: "md", cell: (r) => <span className="text-ink-2">{formatPrice(r.paid)}</span> },
    { key: "due", header: "Dû", align: "right", cell: (r) => <strong className={r.due > 0 ? "text-danger" : "text-primary"}>{formatPrice(r.due)}</strong> },
    { key: "last", header: "Dernier paiement", hideBelow: "xl", cell: (r) => <span className="text-ink-2">{r.lastPaymentAt ? formatDate(r.lastPaymentAt) : "—"}</span> },
    {
      key: "a",
      header: "",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="xs" variant="secondary" upper={false} className="max-md:min-h-11 max-md:px-5" onClick={() => setHistory(r.resellerId)}>Historique</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Commissions" description={data ? `${data.asOfLabel} · ${nextPayoutLabel(data.rows[0])}` : "Commissions des revendeurs : en attente, validées, payées, restant dû."} />
      <Totals data={data} />
      <ChartCard title="Relevés à payer" subtitle={toPay ? `${toPay.length} relevé(s) · ${formatPrice(toPayTotal)} à verser` : "Préparés le 1er et le 16 pour chaque solde d'au moins 5 $"}>
        {toPay ? (
          <StatementsList statements={toPay} showReseller onOpen={setStatement} onPay={canPay ? setPaying : undefined} empty="Aucun relevé à payer : le prochain sera préparé le 1er ou le 16." />
        ) : (
          <Skeleton className="h-16 w-full" />
        )}
      </ChartCard>
      <div className="overflow-hidden rounded-box bg-surface">
        <DataTable columns={columns} rows={data?.rows} loading={!data} rowKey={(r) => r.resellerId} onRowClick={(r) => setHistory(r.resellerId)} skeletonRows={8} />
      </div>

      <Drawer open={history != null} onClose={() => setHistory(null)} title={historyRow ? `Paiements · ${historyRow.name}` : "Paiements"} side="right" className="sm:max-w-[460px]">
        <div className="p-5">
          {historyRow && (
            <div className="mb-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-box bg-chip p-3"><p className="text-xs text-ink-3">En attente</p><p className="font-bold">{formatPrice(historyRow.pending)}</p></div>
              <div className="rounded-box bg-chip p-3"><p className="text-xs text-ink-3">Payé</p><p className="font-bold">{formatPrice(historyRow.paid)}</p></div>
              <div className="rounded-box bg-primary-50 p-3"><p className="text-xs text-ink-3">Dû</p><p className="font-bold text-primary">{formatPrice(historyRow.due)}</p></div>
            </div>
          )}
          <h3 className="mb-2 text-sm font-bold text-ink-3">Relevés</h3>
          {resellerStatements ? <StatementsList statements={resellerStatements} onOpen={setStatement} onPay={canPay ? setPaying : undefined} /> : <Skeleton className="h-16 w-full" />}
          <h3 className="mb-2 mt-5 text-sm font-bold text-ink-3">Paiements</h3>
          {loadingPayments ? <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : <PaymentsList payments={payments ?? []} />}
        </div>
      </Drawer>
      <StatementDrawer id={statement} onClose={() => setStatement(null)} onPay={canPay ? setPaying : undefined} />
      <PayStatementModal statement={paying} onClose={() => setPaying(null)} />
    </>
  );
}

/* ───────────────── Revendeur : ses propres commissions ───────────────── */

function OwnCommissions({ data }: { data: CommissionsOverview }) {
  const row = data.rows[0];
  const [statement, setStatement] = useOpenStatement();
  return (
    <>
      <PageHeader title="Mes commissions" description={`${data.asOfLabel} · ${COMMISSION_RULES_SUMMARY}.`} />
      <section className="rounded-box bg-primary-50 p-4 text-sm text-ink-2">
        <p className="font-bold text-ink">{nextPayoutLabel(row)}</p>
        <p className="mt-1">
          Une commission reste en attente jusqu&apos;à 7 jours après la livraison (ou la vente), puis elle est validée et payée au prochain 1er ou 16 du mois.
          Les frais de livraison des commandes que vous avez livrées vous sont reversés sur le même relevé
          {row.deliveryFees > 0 ? ` (${formatPrice(row.deliveryFees)} à ce jour)` : ""}.
        </p>
      </section>
      <Totals data={data} />
      <div className="grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-3">
        <ChartCard title="Commissions gagnées par mois" subtitle="6 derniers mois, selon les règles de commission" className="xl:col-span-2">
          {data.monthly ? <BarChart title="Commissions par mois" format={money} data={data.monthly.labels.map((l, i) => ({ label: l, value: data.monthly!.values[i] }))} /> : <Skeleton className="h-[260px] w-full" />}
        </ChartCard>
        <ChartCard title="Mes paiements" subtitle={`${data.payments?.length ?? 0} paiement(s) reçu(s)`} delay={0.1}>
          <PaymentsList payments={data.payments ?? []} />
        </ChartCard>
      </div>
      <ChartCard title="Mes relevés de paiement" subtitle="Détail de chaque paiement : commissions validées, déductions et frais de livraison">
        <StatementsList statements={data.statements ?? []} onOpen={setStatement} empty="Aucun relevé pour le moment : il est préparé le 1er ou le 16 dès que vos gains validés atteignent 5 $." />
      </ChartCard>
      <StatementDrawer id={statement} onClose={() => setStatement(null)} />
    </>
  );
}
