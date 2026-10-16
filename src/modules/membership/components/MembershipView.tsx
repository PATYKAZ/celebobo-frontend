"use client";

import Link from "next/link";
import { Crown1, WalletMoney } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { AccountSkeleton } from "@/shared/ui/PageSkeletons";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useMyPoints, useMyPointTransactions } from "../hooks/useMembership";
import type { PointBalance, PointTransaction } from "../types";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function formatPoints(points: number) {
  return Math.abs(points).toLocaleString("fr-FR");
}

function BalanceCard({ balance }: { balance: PointBalance }) {
  return (
    <div className="relative overflow-hidden rounded-box p-5 text-white sm:p-6">
      <Crown1 size="90" variant="Bulk" className="absolute -right-4 -top-4 text-white/10" aria-hidden />
      <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-white/75">Points fidélité</p>
      <p className="mt-1 text-[32px] font-bold leading-[40px]">{formatPoints(balance.available)}</p>
      <p className="mt-2 text-[13px] leading-[19px] text-white/85">
        {balance.available} point{balance.available > 1 ? "s" : ""} disponibles
      </p>
      {balance.pending > 0 && (
        <p className="mt-1 text-[12px] leading-[17px] text-white/70">
          {formatPoints(balance.pending)} en attente
        </p>
      )}
    </div>
  );
}

function TransactionsList({ transactions }: { transactions: PointTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<WalletMoney size={44} variant="Bulk" />}
        title="Aucune transaction de points"
        description="Gagnez des points en passant des commandes et en participant au programme de fidélité."
        action={<Button href={ROUTES.products} upper={false}>Voir les produits</Button>}
      />
    );
  }
  return (
    <ul className="grid gap-2">
      {transactions.map((t) => (
        <li key={t.id} className="flex items-start gap-3 rounded-box bg-chip p-3">
          <div className="min-w-[40px]">
            <span
              className={`block text-[14px] font-bold ${t.points > 0 ? "text-primary" : "text-danger"}`}
            >
              {t.points > 0 ? "+" : ""}{formatPoints(t.points)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-[18px]">{t.reason}</p>
            <p className="text-[11px] leading-[15px] text-ink-3">
              {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(t.createdAt))}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Content() {
  const { data: balance, isLoading: loadingBalance } = useMyPoints();
  const { data: transactions, isLoading: loadingTransactions } = useMyPointTransactions();

  if (loadingBalance || loadingTransactions) return <AccountSkeleton breadcrumb={false} />;

  return (
    <Block pad="none" className="grid gap-5 p-4 sm:gap-6 sm:p-[30px]">
      <div>
        <h1 className="flex items-center gap-2 text-[22px] leading-[28px] text-primary sm:text-h-page">
          <Crown1 size="26" variant="Bold" aria-hidden /> Points fidélité
        </h1>
        <p className="mt-1 text-[13px] leading-[19px] text-ink-2 sm:text-[14px]">
          Gagnez des points à chaque achat et utilisez-les pour vos prochaines commandes.
        </p>
      </div>
      <BalanceCard balance={balance ?? { total: 0, available: 0, pending: 0 }} />
      <div className="border-t border-line-3 pt-5">
        <h2 className="mb-3 text-[17px] leading-[22px]">Vos transactions</h2>
        <TransactionsList transactions={transactions ?? []} />
      </div>
    </Block>
  );
}

/** Espace client : points fidélité (solde et historique). */
export function MembershipView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte", href: ROUTES.profile }, { label: "Points fidélité" }]} />
      <AuthGuard fallback={<AccountSkeleton breadcrumb={false} />}>
        <Content />
      </AuthGuard>
    </>
  );
}
