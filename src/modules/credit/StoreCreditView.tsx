"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, WalletMoney } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { AccountSkeleton } from "@/shared/ui/PageSkeletons";
import { Skeleton } from "@/shared/ui/Skeleton";
import { api } from "@/shared/lib/api";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";

interface Movement {
  kind: "issued" | "spent" | "restored" | "expired";
  kindLabel: string;
  amount: string;
  at: string;
  orderNumber: string | null;
  expiresAt: string | null;
  note: string;
}

interface StoreCredit {
  available: string;
  nextExpiry: string | null;
  history: Movement[];
}

export const storeCreditKey = ["store-credit"] as const;

function Content() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: storeCreditKey, queryFn: () => api.get<StoreCredit>(ENDPOINTS.storeCredit) });
  if (isLoading) return <Skeleton className="h-60 w-full rounded-box!" />;
  if (isError || !data) return <EmptyState icon={<WalletMoney size={44} />} title="Chargement impossible" action={<Button onClick={() => refetch()}>Réessayer</Button>} />;
  const available = Number(data.available);
  return (
    <div className="space-y-5">
      <div className="rounded-box bg-primary-50 p-4">
        <p className="text-[13px] text-primary-dark">Avoir disponible</p>
        <p className="text-[28px] font-bold text-primary">{formatPrice(available)}</p>
        <p className="mt-1 flex items-center gap-2 text-[13px] leading-[19px] text-ink-2">
          <Clock size={16} className="shrink-0" />
          {data.nextExpiry ? `À utiliser avant le ${formatDate(data.nextExpiry)} pour la partie la plus ancienne.` : "Un avoir est valable 6 mois."}
        </p>
      </div>
      <p className="text-[13px] leading-[19px] text-ink-2">L&apos;avoir s&apos;utilise au paiement, sur les articles et la livraison. Il vous est accordé quand vous changez d&apos;avis pendant le délai d&apos;essai de 7 jours. Il n&apos;est ni remboursable en argent ni transférable.</p>
      {data.history.length === 0 ? (
        <p className="text-[13px] text-ink-3">Aucun mouvement pour le moment.</p>
      ) : (
        <ul className="divide-y divide-line-3 rounded-box border border-line-3">
          {data.history.map((m, i) => (
            <li key={`${m.at}-${i}`} className="flex items-center justify-between gap-3 p-3.5 text-[13px]">
              <span className="min-w-0">
                <span className="block font-semibold">{m.kindLabel}{m.orderNumber ? ` · commande ${m.orderNumber}` : ""}</span>
                <span className="block text-[12px] text-ink-3">{formatDate(m.at)}{m.kind === "issued" && m.expiresAt ? ` · valable jusqu'au ${formatDate(m.expiresAt)}` : ""}{m.note ? ` · ${m.note}` : ""}</span>
              </span>
              <span className={`shrink-0 font-bold ${Number(m.amount) >= 0 ? "text-primary" : "text-danger"}`}>{Number(m.amount) >= 0 ? "+" : "−"}{formatPrice(Math.abs(Number(m.amount)))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StoreCreditView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte", href: ROUTES.profile }, { label: "Mon avoir" }]} />
      <AuthGuard fallback={<AccountSkeleton breadcrumb={false} />}>
        <Reveal>
          <Block pad="none" className="p-4 sm:p-[30px]">
            <h1 className="mb-4 text-[22px] leading-[28px] text-primary sm:text-h-page">Mon avoir</h1>
            <Content />
          </Block>
        </Reveal>
      </AuthGuard>
    </>
  );
}
