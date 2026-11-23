"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { InfoCircle, MoneyRecive } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { api, getErrorMessage, idempotent } from "@/shared/lib/api";
import { formatDateTime, formatPrice } from "@/shared/lib/format";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../ui/PageHeader";

interface Collection {
  orderId: number;
  orderNumber: string;
  amount: string;
  left: string;
  collectedAt: string;
  dueAt: string;
  overdue: boolean;
}

interface CashSummary {
  resellerId: number;
  resellerName: string;
  level: string;
  cap: string;
  held: string;
  overdue: string;
  oldestDue: string | null;
  blockedReason: string | null;
  collections: Collection[];
  remittances: { amount: string; reference: string; receivedAt: string }[];
}

const LEVEL: Record<string, string> = { debutant: "Débutant", confirme: "Confirmé", ambassadeur: "Ambassadeur" };
const keys = { all: ["cash"] as const, summary: (id: number | null) => ["cash", "summary", id] as const, overview: ["cash", "overview"] as const };

function Position({ s }: { s: CashSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-box bg-primary-50 p-3.5">
        <p className="text-xs text-primary-dark">À reverser</p>
        <p className="text-xl font-bold text-primary">{formatPrice(Number(s.held))}</p>
      </div>
      <div className="rounded-box bg-page/70 p-3.5">
        <p className="text-xs text-ink-3">En retard (plus de 24 h)</p>
        <p className={`text-xl font-bold ${Number(s.overdue) > 0 ? "text-danger" : ""}`}>{formatPrice(Number(s.overdue))}</p>
      </div>
      <div className="rounded-box bg-page/70 p-3.5">
        <p className="text-xs text-ink-3">Plafond · niveau {LEVEL[s.level] ?? s.level}</p>
        <p className="text-xl font-bold">{formatPrice(Number(s.cap))}</p>
      </div>
    </div>
  );
}

function Detail({ s, canRecord }: { s: CashSummary; canRecord: boolean }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const remit = useMutation({
    mutationFn: () => api.post<CashSummary>(ENDPOINTS.cash.remittances, { resellerId: s.resellerId, amount, reference }, idempotent()),
    onSuccess: () => {
      setAmount("");
      setReference("");
      qc.invalidateQueries({ queryKey: keys.all });
      toast.success("Reversement enregistré", "Les encaissements les plus anciens sont soldés en premier.");
    },
    onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
  });
  return (
    <div className="space-y-4">
      <Position s={s} />
      {s.blockedReason && (
        <p className="flex items-start gap-2 rounded-box bg-danger-100 p-3 text-sm text-danger">
          <InfoCircle size={18} className="mt-0.5 shrink-0" /> Plus de nouvelles commandes : {s.blockedReason}.
        </p>
      )}
      <section>
        <h3 className="mb-2 text-sm font-semibold">Encaissements à reverser</h3>
        {s.collections.length === 0 ? (
          <p className="text-sm text-ink-3">Rien à reverser.</p>
        ) : (
          <ul className="divide-y divide-line-3 rounded-box border border-line-3 text-sm">
            {s.collections.map((c) => (
              <li key={c.orderId} className="flex items-center justify-between gap-3 p-3">
                <span>
                  <b>Commande {c.orderNumber}</b>
                  <span className="block text-xs text-ink-3">Encaissée le {formatDateTime(c.collectedAt)} · à reverser avant le {formatDateTime(c.dueAt)}</span>
                </span>
                <span className={`shrink-0 font-bold ${c.overdue ? "text-danger" : ""}`}>{formatPrice(Number(c.left))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {canRecord && Number(s.held) > 0 && (
        <section className="rounded-box border border-line-3 p-3.5">
          <h3 className="mb-2 text-sm font-semibold">Enregistrer un reversement <span className="font-normal text-ink-3">(au plus {formatPrice(Number(s.held))})</span></h3>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input aria-label="Montant reçu ($)" type="number" min="0.01" step="0.01" max={s.held} placeholder="Montant ($)" title={`Au plus ${s.held} $`} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input aria-label="Référence Mobile Money" placeholder="Référence Mobile Money" value={reference} onChange={(e) => setReference(e.target.value)} />
            <Button upper={false} disabled={!(Number(amount) > 0)} loading={remit.isPending} onClick={() => remit.mutate()}>Enregistrer</Button>
          </div>
        </section>
      )}
      {s.remittances.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Derniers reversements</h3>
          <ul className="space-y-1 text-sm">
            {s.remittances.map((r, i) => (
              <li key={`${r.receivedAt}-${i}`} className="flex justify-between gap-3">
                <span className="text-ink-2">{formatDateTime(r.receivedAt)}{r.reference ? ` · ${r.reference}` : ""}</span>
                <b>{formatPrice(Number(r.amount))}</b>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Mine() {
  const { data, isLoading } = useQuery({ queryKey: keys.summary(null), queryFn: () => api.get<CashSummary>(ENDPOINTS.cash.summary) });
  if (isLoading || !data) return <Skeleton className="h-60 rounded-box!" />;
  return (
    <Block>
      <p className="mb-4 text-sm text-ink-2">L&apos;argent encaissé auprès des clients appartient à Celebobo : reversez-le en totalité par Mobile Money dans les 24 heures, sans déduire votre prime. Au-delà du délai ou du plafond, plus de nouvelles commandes jusqu&apos;à régularisation.</p>
      <Detail s={data} canRecord={false} />
    </Block>
  );
}

function Team() {
  const [selected, setSelected] = useState<number | null>(null);
  const { data, isLoading } = useQuery({ queryKey: keys.overview, queryFn: () => api.get<CashSummary[]>(ENDPOINTS.cash.overview) });
  const detail = useQuery({ queryKey: keys.summary(selected), queryFn: () => api.get<CashSummary>(ENDPOINTS.cash.summary, { params: { resellerId: selected } }), enabled: selected != null });
  if (isLoading || !data) return <Skeleton className="h-60 rounded-box!" />;
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Block pad="none" className="overflow-hidden">
        {data.length === 0 ? (
          <EmptyState icon={<MoneyRecive size={40} />} title="Rien à reverser" description="Aucun revendeur ne détient d'argent encaissé." />
        ) : (
          <ul className="divide-y divide-line-3">
            {data.map((r) => (
              <li key={r.resellerId}>
                <button type="button" onClick={() => setSelected(r.resellerId)} className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-page/60 ${selected === r.resellerId ? "bg-primary-50" : ""}`}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{r.resellerName}</span>
                    <span className="block text-xs text-ink-3">{r.blockedReason ? `Bloqué : ${r.blockedReason}` : `Plafond ${formatPrice(Number(r.cap))}`}</span>
                  </span>
                  <span className={`shrink-0 font-bold ${r.blockedReason ? "text-danger" : ""}`}>{formatPrice(Number(r.held))}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Block>
      <Block>{selected == null ? <p className="text-sm text-ink-3">Choisissez un revendeur pour voir ses encaissements et enregistrer un reversement.</p> : detail.data ? <Detail s={detail.data} canRecord /> : <Skeleton className="h-40 rounded-box!" />}</Block>
    </div>
  );
}

function Content() {
  const isTeam = useCan("cash.manage");
  return (
    <>
      <PageHeader title={isTeam ? "Encaissements des revendeurs" : "Argent à reverser"} description="Reversement en totalité sous 24 heures ; plafond d'argent non reversé selon le niveau (300 $ débutant, 1 000 $ confirmé, 2 500 $ ambassadeur)." />
      {isTeam ? <Team /> : <Mine />}
    </>
  );
}

export function CashView() {
  return (
    <PermissionGuard permission="cash.view.own">
      <Content />
    </PermissionGuard>
  );
}
