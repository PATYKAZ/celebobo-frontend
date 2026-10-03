"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight2, Box, Messages2, MoneyRecive, TickCircle, Wallet3 } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { Reveal, RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";
import { formatPrice, formatRelative } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { StatusDot } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { PageHeader } from "@/modules/admin/ui/PageHeader";
import { StatCard } from "@/modules/admin/ui/StatCard";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useSetOrderStatus } from "@/modules/orders/hooks/useOrderWorkflow";
import { ORDER_FLOW, ORDER_STATUS_LABEL, ORDER_STATUS_TONE, type OrderStatus, type PaymentMethod } from "@/modules/orders/types";
import { useResellerDashboard } from "../hooks/useResellerSpace";
import type { ResellerOpenOrder } from "../types";
import { AvailabilityToggle } from "./AvailabilityToggle";
import { InviteCard } from "./InviteCard";

const METHOD_STYLE: Record<PaymentMethod, { label: string; cls: string }> = {
  OrangeMoney: { label: "Orange Money", cls: "bg-[#FF7900] text-white" },
  AirtelMoney: { label: "Airtel Money", cls: "bg-[#E40000] text-white" },
  "M-Pesa": { label: "M-Pesa", cls: "bg-[#2AAE4A] text-white" },
  Cash: { label: "Cash", cls: "bg-ink-dark text-white" },
};

function OrderRow({ o }: { o: ResellerOpenOrder }) {
  const advance = useSetOrderStatus();
  const next = o.nextStatus;
  return (
    <li className="rounded-box border border-line-3 p-4 transition-colors hover:border-primary/40 sm:flex sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3 sm:block">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Link prefetch={false} href={ROUTES.admin.order(o.id)} className="inline-flex min-h-9 items-center text-[16px] font-bold hover:text-primary sm:min-h-0 sm:text-[15px]">Commande #{o.id}</Link>
            <StatusDot tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</StatusDot>
            <span className="text-[12px] text-ink-3">{formatRelative(o.createdAt)}</span>
          </div>
          <span className="shrink-0 text-[17px] font-bold sm:hidden">{formatPrice(o.total)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-[19px] text-ink-2 sm:truncate"><strong className="text-ink">{o.clientName}</strong> · {o.itemsSummary}</p>
      </div>
      <div className="mt-3.5 flex items-center gap-2 sm:mt-0 sm:shrink-0 sm:justify-end">
        <span className="mr-1 hidden text-[16px] font-bold sm:inline">{formatPrice(o.total)}</span>
        {o.conversationId != null && (
          <Link prefetch={false} href={ROUTES.admin.conversation(o.conversationId)} className="relative inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-box bg-chip px-3 text-[13px] font-bold transition-all hover:bg-primary hover:text-white active:scale-95 sm:h-9 sm:flex-none sm:rounded-md sm:text-[12px]">
            <Messages2 size={16} variant="Bold" /> Discussion
            {o.unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-w-[20px] place-items-center rounded-full bg-danger px-1 text-[11px] leading-[20px] text-white ring-2 ring-white">{o.unread}</span>}
          </Link>
        )}
        {next && (
          <Button
            size="sm"
            className="max-sm:min-h-12 max-sm:flex-[2] sm:h-9"
            upper={false}
            loading={advance.isPending}
            leftIcon={<TickCircle size={14} variant="Bold" />}
            onClick={() =>
              advance.mutate(
                { orderId: o.id, to: next },
                { onSuccess: () => toast.success(`Commande #${o.id}`, `Statut : ${ORDER_STATUS_LABEL[next]}`), onError: (e) => toast.error("Action impossible", getErrorMessage(e)) },
              )
            }
          >
            Marquer « {ORDER_STATUS_LABEL[next].toLowerCase()} »
          </Button>
        )}
      </div>
    </li>
  );
}

/** Espace revendeur (route /admin pour le rôle revendeur) : ses commandes, ses ventes, sa commission, son code. */
export function ResellerDashboardView() {
  const { user } = useAuth();
  const { data, isLoading } = useResellerDashboard();
  const first = user?.firstName || user?.username || "";

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title={`Bonjour, ${first}`} description="Chargement de votre espace…" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[112px] rounded-box sm:h-[132px]" />)}</div>
        <Skeleton className="h-[320px] rounded-box" />
      </>
    );
  }

  const statuses = (Object.keys(data.orders.byStatus) as OrderStatus[]).sort((a, b) => ORDER_FLOW.indexOf(a) - ORDER_FLOW.indexOf(b));

  return (
    <>
      <PageHeader title={`Bonjour, ${first} 👋`} description={`Votre espace revendeur · ${data.period.label}`} actions={<AvailabilityToggle value={data.availability} />} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Commandes ouvertes" value={data.orders.open} icon={<Box size={22} variant="Bold" />} tone="blue" />
        <StatCard label="Discussions à répondre" value={data.awaitingReply} icon={<Messages2 size={22} variant="Bold" />} tone={data.awaitingReply ? "orange" : "green"} delay={0.05} />
        <StatCard
          label={`Mes ventes · ${data.period.label}`}
          value={data.sales.revenue}
          format={formatPrice}
          icon={<MoneyRecive size={22} variant="Bold" />}
          delta={data.sales.delta}
          deltaLabel={`vs ${data.period.previousLabel}`}
          delay={0.1}
        />
        <StatCard label={`Commission due (taux ${Math.round(data.commission.rate * 100)} %)`} value={data.commission.due} format={formatPrice} icon={<Wallet3 size={22} variant="Bold" />} tone="green" deltaLabel="" delay={0.15} />
      </div>

      <div className="grid items-start gap-3 sm:gap-4 xl:grid-cols-[1fr_390px]">
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <Reveal>
            <Block pad="sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[16px] font-bold leading-[22px]">Mes commandes par statut</h2>
                <Link href={ROUTES.admin.orders} className="group -mr-2 inline-flex min-h-11 items-center gap-1 px-2 text-[13px] font-bold text-primary">
                  Tout voir <ArrowRight2 size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              {statuses.length ? (
                <RevealGroup className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                  {statuses.map((s) => (
                    <RevealItem key={s} className="shrink-0">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-chip py-1.5 pl-1.5 pr-3 text-[13px] font-semibold">
                        <span className="grid min-w-7 place-items-center rounded-full bg-white px-1.5 py-0.5 text-[13px] font-bold">{data.orders.byStatus[s]}</span>
                        <StatusDot tone={ORDER_STATUS_TONE[s]}>{ORDER_STATUS_LABEL[s]}</StatusDot>
                      </span>
                    </RevealItem>
                  ))}
                </RevealGroup>
              ) : (
                <p className="mt-3 text-[13px] text-ink-3">Aucune commande assignée pour le moment.</p>
              )}
            </Block>
          </Reveal>

          <Reveal>
            <Block pad="sm">
              <h2 className="mb-4 text-[16px] font-bold leading-[22px]">Mes commandes ouvertes</h2>
              {data.openOrders.length === 0 ? (
                <EmptyState icon={<Box size={34} variant="Bulk" />} title="Rien à traiter" description="Les commandes qui vous sont assignées apparaîtront ici en temps réel." className="py-8" />
              ) : (
                <ul className="space-y-3">{data.openOrders.map((o) => <OrderRow key={o.id} o={o} />)}</ul>
              )}
            </Block>
          </Reveal>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <InviteCard code={data.code} invitedCount={data.invitedCount} />
          <Reveal>
            <Block pad="sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[16px] font-bold leading-[22px]">Mes dernières ventes</h2>
                <Link href={ROUTES.admin.sales} className="-mr-2 inline-flex min-h-11 items-center px-2 text-[13px] font-bold text-primary hover:underline">Voir tout</Link>
              </div>
              {data.recentSales.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-ink-3">Aucune vente enregistrée.</p>
              ) : (
                <ul className="divide-y divide-line-3">
                  {data.recentSales.map((s) => (
                    <li key={s.id} className="flex min-w-0 items-center gap-3 py-3">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-page">{s.productImage && <Image src={s.productImage} alt="" fill sizes="44px" className="object-cover" />}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold leading-[18px]">{s.productName}{s.quantity > 1 ? ` ×${s.quantity}` : ""}</p>
                        <p className="text-[12px] text-ink-3">{formatRelative(s.soldAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold">{formatPrice(s.total)}</p>
                        <span className={cn("rounded px-1.5 py-px text-[10px] font-bold", METHOD_STYLE[s.method].cls)}>{METHOD_STYLE[s.method].label}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Block>
          </Reveal>
        </div>
      </div>
    </>
  );
}
