"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ArrowLeft2, Call, Convert, Location, MessageText1, Note, Sms, User, Wallet3 } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { formatDateTime, formatPrice, formatRelative } from "@/shared/lib/format";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { conversationsService } from "@/modules/messaging/services/conversations.service";
import { ORDER_FINAL, type Order } from "@/modules/orders/types";
import { PageHeader } from "../../ui/PageHeader";
import { useAdminOrder, useResellerOptions } from "../hooks/useAdminOrders";
import { AssignResellerModal } from "./AssignResellerModal";
import { StatusHistory, StatusStepper } from "./OrderProgress";
import { AvailabilityDot, OrderStatusDot, PAYMENT_LABEL } from "./parts";
import { StatusActionBar } from "./StatusActionBar";

export function OrderDetailView({ id }: { id: number }) {
  return (
    <PermissionGuard permission="orders.view.own">
      <Content id={id} />
    </PermissionGuard>
  );
}

function Card({ title, icon, children, delay = 0 }: { title: string; icon: ReactNode; children: ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <Block pad="sm">
        <h3 className="mb-3 flex items-center gap-2 text-[15px]">
          <span className="grid size-8 place-items-center rounded-full bg-primary-50 text-primary">{icon}</span>
          {title}
        </h3>
        {children}
      </Block>
    </Reveal>
  );
}

function Content({ id }: { id: number }) {
  const { data: order, isLoading, error } = useAdminOrder(id);
  const canAssign = useCan("orders.assign");
  const canConvert = useCan("sales.convert");
  const [assigning, setAssigning] = useState<Order | null>(null);

  if (isLoading) {
    return (
      <>
        <Skeleton className="h-24 w-full rounded-box" />
        <Skeleton className="h-40 w-full rounded-box" />
        <Skeleton className="h-72 w-full rounded-box" />
      </>
    );
  }
  if (error || !order) {
    return (
      <Block>
        <EmptyState icon={<Note size={40} />} title="Commande introuvable" description="Cette commande n'existe pas ou ne vous est pas assignée." action={<Button href={ROUTES.admin.orders} size="sm" upper={false}>Retour aux commandes</Button>} />
      </Block>
    );
  }

  const closed = ORDER_FINAL.includes(order.status);
  const convertBlock = order.convertedToSales ? "Cette commande a déjà été convertie en ventes." : order.status === "annulee" ? "Une commande annulée ne peut pas être convertie." : order.status === "attente" ? "Assignez puis traitez la commande avant de la convertir." : null;

  return (
    <>
      <PageHeader
        title={`Commande #${order.id}`}
        description={`Passée le ${formatDateTime(order.createdAt)} par ${order.user.name}`}
        actions={
          <>
            <Button href={ROUTES.admin.orders} variant="chip" size="sm" upper={false} leftIcon={<ArrowLeft2 size={16} />}>Commandes</Button>
            <OrderStatusDot status={order.status} />
          </>
        }
      >
        <StatusStepper order={order} />
        <div className="mt-6 border-t border-line-3 pt-4">
          <StatusActionBar order={order} onAssign={canAssign ? () => setAssigning(order) : undefined} />
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <Reveal>
            <Block pad="none" className="overflow-hidden">
              <h3 className="px-5 pb-3 pt-5 text-[16px] sm:px-6">Articles ({order.items.reduce((n, i) => n + i.quantity, 0)})</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-[14px]">
                  <thead>
                    <tr className="border-y border-line-3 bg-page/50 text-left text-[12px] uppercase tracking-wide text-ink-3">
                      <th className="px-5 py-2.5 font-semibold sm:px-6">Produit</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Prix</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Qté</th>
                      <th className="px-5 py-2.5 text-right font-semibold sm:px-6">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it) => (
                      <tr key={it.id} className="border-b border-line-3/70">
                        <td className="px-5 py-3 sm:px-6">
                          <div className="flex items-center gap-3">
                            <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-page">{it.productImage && <Image src={it.productImage} alt="" fill sizes="48px" className="object-cover" />}</span>
                            <div className="min-w-0">
                              {it.productId ? <Link href={ROUTES.product(it.productId)} className="line-clamp-2 font-semibold hover:text-primary">{it.productName}</Link> : <span className="font-semibold">{it.productName}</span>}
                              {it.variantLabel && <p className="text-[12px] text-ink-3">Variante : {it.variantLabel}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">{formatPrice(it.unitPrice)}</td>
                        <td className="px-3 py-3 text-center">{it.quantity}</td>
                        <td className="px-5 py-3 text-right font-bold sm:px-6">{formatPrice(it.unitPrice * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-right text-[13px] text-ink-2 sm:px-6">Total de la commande</td>
                      <td className="px-5 py-4 text-right text-[18px] font-bold text-primary sm:px-6">{formatPrice(order.totalPrice)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Block>
          </Reveal>

          <Reveal delay={0.05}>
            <Block>
              <h3 className="mb-5 text-[16px]">Historique des statuts</h3>
              <StatusHistory order={order} />
            </Block>
          </Reveal>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Client" icon={<User size={17} variant="Bold" />}>
            <p className="text-[14px] font-bold">{order.user.name}</p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-ink-2">
              {order.user.email && <li className="flex items-center gap-2"><Sms size={15} /> {order.user.email}</li>}
              {order.user.phone && <li className="flex items-center gap-2"><Call size={15} /> {order.user.phone}</li>}
            </ul>
          </Card>

          <Card title="Livraison & paiement" icon={<Location size={17} variant="Bold" />} delay={0.05}>
            <dl className="space-y-3 text-[13px]">
              <div>
                <dt className="text-ink-3">Adresse de livraison</dt>
                <dd className="mt-0.5 font-semibold">{order.deliveryAddress ?? "—"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-ink-3"><Wallet3 size={14} /> Mode de paiement choisi</dt>
                <dd className="mt-0.5 font-semibold">{order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Note du client</dt>
                <dd className="mt-0.5 rounded-md bg-page/60 px-3 py-2 italic text-ink-2">{order.note ?? "Aucune note."}</dd>
              </div>
            </dl>
          </Card>

          <ResellerCard order={order} canAssign={canAssign && !closed} onAssign={() => setAssigning(order)} />

          {order.conversationId != null && <DiscussionCard conversationId={order.conversationId} />}

          {canConvert && (
            <Reveal delay={0.15}>
              <Block pad="sm">
                <h3 className="mb-2 flex items-center gap-2 text-[15px]"><span className="grid size-8 place-items-center rounded-full bg-primary-50 text-primary"><Convert size={17} variant="Bold" /></span> Enregistrer les ventes</h3>
                <p className="mb-3 text-[13px] leading-[19px] text-ink-2">{convertBlock ?? "Convertissez cette commande en ventes, article par article, avec le prix final négocié."}</p>
                <span title={convertBlock ?? undefined} className="block">
                  <Button href={convertBlock ? undefined : `${ROUTES.admin.saleConvert}?order=${order.id}`} size="sm" upper={false} fullWidth disabled={!!convertBlock}>Convertir en ventes</Button>
                </span>
              </Block>
            </Reveal>
          )}
        </div>
      </div>

      <AssignResellerModal order={assigning} onClose={() => setAssigning(null)} />
    </>
  );
}

function ResellerCard({ order, canAssign, onAssign }: { order: Order; canAssign: boolean; onAssign: () => void }) {
  const { data } = useResellerOptions();
  const r = order.assignedRevendeur;
  const opt = data?.find((x) => x.id === r?.id);
  return (
    <Card title="Revendeur assigné" icon={<User size={17} variant="Bold" />} delay={0.1}>
      {r ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold">{r.name}</p>
            <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-3">
              {opt && <AvailabilityDot value={opt.availability} withLabel />}
              {opt && <span>· code {opt.code}</span>}
            </div>
          </div>
          {canAssign && <Button size="xs" variant="chip" upper={false} onClick={onAssign}>Réassigner</Button>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-ink-3">Aucun revendeur assigné.</p>
          {canAssign && <Button size="xs" upper={false} onClick={onAssign}>Assigner</Button>}
        </div>
      )}
    </Card>
  );
}

function DiscussionCard({ conversationId }: { conversationId: number }) {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "orders", "discussion", conversationId], queryFn: () => conversationsService.messages(conversationId), staleTime: 30_000 });
  const last = data?.[data.length - 1];
  return (
    <Card title="Discussion liée" icon={<MessageText1 size={17} variant="Bold" />} delay={0.12}>
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : last ? (
        <div className="rounded-md bg-page/60 p-3">
          <p className="text-[12px] font-semibold">{last.sender.name} <span className="font-normal text-ink-3">· {formatRelative(last.timestamp)}</span></p>
          <p className="mt-1 line-clamp-3 whitespace-pre-line text-[13px] text-ink-2">{last.content ?? "📷 Image"}</p>
        </div>
      ) : (
        <p className="text-[13px] text-ink-3">Aucun message pour l&apos;instant.</p>
      )}
      <Button href={ROUTES.admin.conversation(conversationId)} size="sm" variant="outline" upper={false} fullWidth className="mt-3">Ouvrir la discussion</Button>
    </Card>
  );
}
