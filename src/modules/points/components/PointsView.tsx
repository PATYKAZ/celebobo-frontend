"use client";

import { MyRewards } from "@/modules/cagnotte/MyRewards";
import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, InfoCircle, Receipt2, WalletMoney } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { AccountSkeleton } from "@/shared/ui/PageSkeletons";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useSiteSettings } from "@/modules/site";
import { usePointsBalance } from "../hooks/usePoints";
import { formatPoints, isReferral, pointsMovementLabel, pointsReleaseDelay, type PointsBalance } from "../types";

const longDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function Stat({ label, value, children, accent }: { label: string; value: string; children?: ReactNode; accent?: boolean }) {
  return (
    <div className={cn("rounded-box p-4 sm:p-5", accent ? "bg-primary text-white" : "bg-page/60")}>
      <p className={cn("text-[12px] font-semibold uppercase tracking-wide", accent ? "text-white/80" : "text-ink-3")}>{label}</p>
      <p className="mt-1 text-[24px] font-extrabold leading-[30px] tabular-nums">{value}</p>
      {children && <p className={cn("mt-1 text-[12px] leading-[17px]", accent ? "text-white/85" : "text-ink-2")}>{children}</p>}
    </div>
  );
}

function History({ history }: { history: PointsBalance["history"] }) {
  if (!history.length) {
    return <p className="rounded-box bg-page/60 p-4 text-[14px] text-ink-2">Aucun mouvement pour le moment : vos points apparaîtront ici après votre première commande livrée.</p>;
  }
  return (
    <ul className="divide-y divide-line-3 rounded-box border border-line-3">
      {history.map((m, i) => (
        <li key={`${m.at}-${m.kind}-${i}`} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold">
              {pointsMovementLabel(m.kind)}
              {m.pending && <span className="rounded-full bg-star/15 px-2 py-0.5 text-[10px] font-bold uppercase text-warn">En attente</span>}
            </p>
            <p className="text-[12px] text-ink-3">
              {formatDate(m.at)}
              {m.orderNumber ? (
                <>
                  {" · "}
                  <Link href={ROUTES.orderDetail(m.orderNumber)} className="font-semibold text-primary hover:underline">Commande {m.orderNumber}</Link>
                </>
              ) : (
                isReferral(m.kind) && " · Commande d'un invité"
              )}
            </p>
          </div>
          <p className={cn("shrink-0 text-[15px] font-bold tabular-nums", m.amount >= 0 ? "text-primary" : "text-danger")}>
            {m.amount >= 0 ? "+" : "−"}{formatPoints(Math.abs(m.amount))}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Content() {
  const { programmes: { points }, returnDays } = useSiteSettings();
  const { isReseller } = useAuth();
  const { data, isLoading, isError, refetch } = usePointsBalance();
  // délai réglé dans l'admin (12 mois par défaut, le temps que les réglages arrivent)
  const months = points.validityMonths || 12;

  return (
    <Reveal>
      <Block pad="none" className="p-4 sm:p-[30px]">
        <h1 className="text-[22px] leading-[28px] text-primary sm:text-h-page">Mes points</h1>
        <p className="mt-1 text-[13px] leading-[19px] text-ink-2 sm:text-[14px]">
          {data?.closesAt ? "Utilisez vos points au paiement : vous choisissez combien en utiliser (1 point = 1 $)." : <>À chaque commande livrée, vous gagnez {points.percent ? `${points.percent.toLocaleString("fr-FR")} %` : "un pourcentage"} de ce que vous payez pour vos articles en points de fidélité (1 point = 1 $). Au paiement, vous choisissez combien de points utiliser.{isReseller && points.referralPercent ? ` Vous recevez aussi ${points.referralPercent.toLocaleString("fr-FR")} % des factures de vos clients invités pendant ${points.referralMonths} mois, payées sans points ni coupon.` : null}</>}
        </p>

        <div className="mt-4 sm:mt-6">
          {isLoading ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[104px] rounded-box!" />)}</div>
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-box!" />)}
            </div>
          ) : isError || !data ? (
            <EmptyState icon={<WalletMoney size={44} />} title="Chargement impossible" description="Une erreur est survenue lors de la récupération de vos points." action={<Button onClick={() => refetch()}>Réessayer</Button>} />
          ) : !data.eligible ? (
            <EmptyState icon={<WalletMoney size={44} variant="Bulk" />} title="Programme indisponible" description="Le programme de points de fidélité n'est pas actif pour le moment." action={<Button href={ROUTES.products}>Découvrir la boutique</Button>} />
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat accent label="Points disponibles" value={formatPoints(data.available)}>Utilisables dès maintenant au paiement.</Stat>
                <Stat label="En attente" value={formatPoints(data.pending)}>Disponibles {pointsReleaseDelay(returnDays)}.</Stat>
                <Stat label="Factures encaissées" value={String(data.ordersCount)}>
                  {data.ordersCount > 0 ? `Commande${data.ordersCount > 1 ? "s" : ""} livrée${data.ordersCount > 1 ? "s" : ""} pour ${formatPrice(data.ordersTotal)}` : "Aucune commande livrée pour le moment."}
                </Stat>
              </div>

              {data.closesAt && (
                <p role="status" className="flex items-start gap-3 rounded-box bg-star/10 p-3.5 text-[13px] leading-[19px] text-warn sm:p-4 sm:text-[14px]">
                  <InfoCircle size={20} variant="Bold" className="mt-0.5 shrink-0" />
                  <span>Le programme de points se termine : vos points restent utilisables jusqu&apos;au {longDate.format(new Date(data.closesAt))}. Les nouvelles commandes ne rapportent plus de points.</span>
                </p>
              )}

              {!data.closesAt && <p className="flex items-start gap-3 rounded-box bg-primary-50 p-3.5 text-[13px] leading-[19px] text-primary-dark sm:p-4 sm:text-[14px]">
                <Clock size={20} variant="Bold" className="mt-0.5 shrink-0" />
                <span>
                  {data.nextExpiry
                    ? `Vos points restent valables jusqu'au ${longDate.format(new Date(data.nextExpiry))} tant que vous achetez au moins une fois tous les ${months} mois.`
                    : `Vos points restent valables tant que vous achetez au moins une fois tous les ${months} mois.`}
                </span>
              </p>}

              <section>
                <h2 className="mb-3 flex items-center gap-2 text-[16px] font-bold"><Receipt2 size={18} /> Historique</h2>
                <History history={data.history} />
              </section>

              <MyRewards />
            </div>
          )}
        </div>
      </Block>
    </Reveal>
  );
}

export function PointsView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte", href: ROUTES.profile }, { label: "Mes points" }]} />
      <AuthGuard fallback={<AccountSkeleton breadcrumb={false} />}>
        <Content />
      </AuthGuard>
    </>
  );
}
