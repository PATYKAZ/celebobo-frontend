"use client";

import { useState } from "react";
import { ShieldTick } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatDateTime } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { AccountSkeleton } from "@/shared/ui/PageSkeletons";
import { ConfirmDialog } from "@/modules/admin/ui/ConfirmDialog";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useConsents, useGiveConsents, useWithdrawConsent } from "../hooks/useConsents";
import { CONSENT_SOURCE_LABELS, type ConsentKind, type ConsentRecord, type ConsentStatus } from "../types";

function Badge({ status }: { status: ConsentStatus }) {
  const [label, tone] = !status.given
    ? ["Non donné", "bg-chip text-ink-2"]
    : status.outdated
      ? ["À renouveler", "bg-star/15 text-warn"]
      : ["Donné", "bg-primary-50 text-primary-dark"];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", tone)}>{label}</span>;
}

function ConsentRow({ status, busy, onGive, onWithdraw }: { status: ConsentStatus; busy: boolean; onGive: () => void; onWithdraw: () => void }) {
  const renew = !status.given || status.outdated;
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
          {status.label}
          <Badge status={status} />
          {status.required && <span className="text-xs font-semibold text-ink-3">obligatoire</span>}
        </p>
        <p className="mt-1 text-xs text-ink-3">
          {status.given && status.acceptedAt
            ? `Version ${status.version || "—"} acceptée le ${formatDate(status.acceptedAt)}${status.source ? ` (${CONSENT_SOURCE_LABELS[status.source]})` : ""}.`
            : "Vous n'avez pas donné votre accord."}
          {status.outdated && ` La version en vigueur est la ${status.currentVersion}.`}
        </p>
      </div>
      <div className="flex shrink-0 gap-2 max-sm:[&>*]:flex-1">
        {renew && (
          <Button size="sm" upper={false} loading={busy} onClick={onGive}>
            {status.given ? "Accepter la nouvelle version" : "Donner mon accord"}
          </Button>
        )}
        {status.given && (
          <Button size="sm" variant="ghost" upper={false} className="text-danger hover:bg-danger-100!" loading={busy && !renew} onClick={onWithdraw}>
            Retirer
          </Button>
        )}
      </div>
    </li>
  );
}

function History({ history, labels }: { history: ConsentRecord[]; labels: Record<string, string> }) {
  if (!history.length) return null;
  return (
    <div className="mt-6">
      <h2 className="text-base">Historique</h2>
      <ul className="mt-3 divide-y divide-line-3 rounded-box border border-line-3 text-sm">
        {history.map((r, i) => (
          <li key={`${r.kind}-${r.acceptedAt}-${i}`} className="px-4 py-3 sm:px-5">
            <p className="font-semibold">{labels[r.kind] ?? r.kind}</p>
            <p className="text-xs text-ink-3">
              Version {r.version || "—"} acceptée le {formatDateTime(r.acceptedAt)} ({CONSENT_SOURCE_LABELS[r.source]})
              {r.withdrawnAt && ` · retirée le ${formatDateTime(r.withdrawnAt)}`}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Content() {
  const { data, isLoading } = useConsents();
  const give = useGiveConsents();
  const withdraw = useWithdrawConsent();
  const [confirm, setConfirm] = useState<ConsentStatus | null>(null);
  const pending = give.isPending ? give.variables?.[0] : withdraw.isPending ? withdraw.variables : undefined;

  const doGive = (kind: ConsentKind) =>
    give.mutate([kind], {
      onSuccess: () => toast.success("Merci, votre accord est enregistré"),
      onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
    });
  // le retrait est aussi simple que l'accord : un clic pour les offres commerciales
  const doWithdraw = (kind: ConsentKind) =>
    withdraw.mutate(kind, {
      onSuccess: () => {
        setConfirm(null);
        toast.success("Consentement retiré");
      },
      onError: (e) => toast.error("Retrait impossible", getErrorMessage(e)),
    });

  const labels = Object.fromEntries((data?.consents ?? []).map((c) => [c.kind, c.label]));
  return (
    <Block pad="none" className="mx-auto max-w-[820px] p-4 sm:p-8">
      <h1 className="flex items-center gap-2 text-xl text-primary sm:text-h-page"><ShieldTick size={24} variant="Bold" /> Mes consentements</h1>
      <p className="mb-4 mt-1 text-sm text-ink-2 sm:mb-6 sm:text-sm">
        Ce que vous avez accepté, avec la version de la{" "}
        <a href={ROUTES.page("politique-de-confidentialite")} target="_blank" rel="noopener" className="font-semibold text-ink underline">politique de confidentialité</a> et la date. Vous pouvez retirer chaque consentement à tout moment.
      </p>
      {isLoading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <>
          <ul aria-label="État de mes consentements" className="divide-y divide-line-3 rounded-box border border-line-3">
            {data.consents.map((c) => (
              <ConsentRow
                key={c.kind}
                status={c}
                busy={pending === c.kind}
                onGive={() => doGive(c.kind)}
                onWithdraw={() => (c.required ? setConfirm(c) : doWithdraw(c.kind))}
              />
            ))}
          </ul>
          <History history={data.history} labels={labels} />
        </>
      )}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Retirer ce consentement ?"
        message="Ce consentement est obligatoire : sans lui, votre compte ne peut plus être utilisé. Vous pourrez l'accepter de nouveau ou fermer votre compte. Ce qui a été fait avant le retrait reste valable."
        confirmLabel="Retirer"
        loading={withdraw.isPending}
        onConfirm={() => confirm && doWithdraw(confirm.kind)}
      />
    </Block>
  );
}

export function ConsentsView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte" }, { label: "Mes consentements" }]} />
      <AuthGuard fallback={<AccountSkeleton breadcrumb={false} />}>
        <Reveal direction="up">
          <Content />
        </Reveal>
      </AuthGuard>
    </>
  );
}
