"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ArrowLeft2, Call, Convert, Location, MessageText1, Note, Sms, Truck, User, Wallet3 } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { formatDateTime, formatPrice, formatRelative } from "@/shared/lib/format";
import { formatPointsEarned } from "@/modules/points/types";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Input, Select } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { api, getErrorMessage } from "@/shared/lib/api";
import { ENDPOINTS } from "@/config/endpoints";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { conversationsService } from "@/modules/messaging/services/conversations.service";
import { ATTEMPT_REASONS, ORDER_FINAL, shippingFeeLabel, type AttemptReason, type Order } from "@/modules/orders/types";
import { PageHeader } from "../../ui/PageHeader";
import { useAdminOrder, useRecordAttempt, useRecordRefund, useResellerOptions } from "../hooks/useAdminOrders";
import { AssignResellerModal } from "./AssignResellerModal";
import { StatusHistory, StatusStepper } from "./OrderProgress";
import { AvailabilityDot, OrderStatusDot, PAYMENT_LABEL } from "./parts";
import { StatusActionBar } from "./StatusActionBar";

export function OrderDetailView({ id }: { id: number }) {
  return (
    <PermissionGuard permission="orders.view.assigned">
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
        <div className="mt-4 lg:mt-6 lg:border-t lg:border-line-3 lg:pt-4">
          <StatusActionBar order={order} onAssign={canAssign ? () => setAssigning(order) : undefined} />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <Reveal>
            <Block pad="none" className="overflow-hidden">
              <h3 className="px-4 pb-3 pt-4 text-[16px] sm:px-6 sm:pt-5">Articles ({order.items.reduce((n, i) => n + i.quantity, 0)})</h3>
              {/* Mobile : un article par ligne-carte */}
              <ul className="divide-y divide-line-3/70 border-t border-line-3 sm:hidden">
                {order.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 p-4">
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-page">{it.productImage && <Image src={it.productImage} alt="" fill sizes="56px" className="object-cover" />}</span>
                    <div className="min-w-0 flex-1">
                      {it.productSlug ? <Link href={ROUTES.product(it.productSlug)} className="-my-1 line-clamp-2 py-1 text-[14px] font-semibold leading-[19px]">{it.productName}</Link> : <span className="text-[14px] font-semibold">{it.productName}</span>}
                      {it.variantLabel && <p className="text-[12px] text-ink-3">{it.variantLabel}</p>}
                      <p className="mt-0.5 text-[12px] text-ink-2">{it.quantity} × {formatPrice(it.unitPrice)}</p>
                    </div>
                    <p className="shrink-0 text-[15px] font-bold">{formatPrice(it.unitPrice * it.quantity)}</p>
                  </li>
                ))}
                <li className="flex items-center justify-between bg-page/50 px-4 py-3.5">
                  <span className="text-[13px] text-ink-2">Total de la commande</span>
                  <span className="text-[18px] font-bold text-primary">{formatPrice(order.totalPrice)}</span>
                </li>
                {(!!order.points || !!order.pointsEarned) && (
                  <li className="px-4 pb-3.5 text-right text-[12px] text-ink-2">
                    {!!order.points && <span className="block">dont points de fidélité utilisés : <b className="text-danger">-{formatPrice(order.points)}</b></span>}
                    {!!order.pointsEarned && <span className="block font-semibold text-primary">+{formatPointsEarned(order.pointsEarned)}</span>}
                  </li>
                )}
              </ul>
              <div className="hidden overflow-x-auto sm:block">
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
                              {it.productSlug ? <Link href={ROUTES.product(it.productSlug)} className="line-clamp-2 font-semibold hover:text-primary">{it.productName}</Link> : <span className="font-semibold">{it.productName}</span>}
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
                    {!!order.points && (
                      <tr>
                        <td colSpan={3} className="px-5 pt-4 text-right text-[13px] text-ink-2 sm:px-6">Points de fidélité utilisés</td>
                        <td className="px-5 pt-4 text-right font-semibold text-danger sm:px-6">-{formatPrice(order.points)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-right text-[13px] text-ink-2 sm:px-6">Total de la commande</td>
                      <td className="px-5 py-4 text-right text-[18px] font-bold text-primary sm:px-6">{formatPrice(order.totalPrice)}</td>
                    </tr>
                    {!!order.pointsEarned && (
                      <tr>
                        <td colSpan={4} className="px-5 pb-4 text-right text-[13px] font-semibold text-primary sm:px-6">+{formatPointsEarned(order.pointsEarned)} à la livraison</td>
                      </tr>
                    )}
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

        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <Card title="Client" icon={<User size={17} variant="Bold" />}>
            <p className="text-[14px] font-bold">{order.user.name}</p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-ink-2">
              {order.user.email && <li className="flex items-center gap-2"><Sms size={15} /> {order.user.email}</li>}
              {order.user.phone && <li className="flex items-center gap-2"><Call size={15} /> {order.user.phone}</li>}
            </ul>
          </Card>

          <Card title="Livraison & paiement" icon={<Location size={17} variant="Bold" />} delay={0.05}>
            {order.deliveryCodeLocked && !closed && (
              <p className="mb-3 rounded-md bg-danger-50 px-3 py-2.5 text-[13px] leading-[19px] text-danger">
                <strong>Code de livraison bloqué</strong> après {order.deliveryCodeAttempts} codes incorrects. Un responsable doit vérifier avec le client puis confirmer la livraison avec un motif.
              </p>
            )}
            {order.awaitingShippingQuote && !closed && (
              <p className="mb-3 rounded-md bg-star/10 px-3 py-2.5 text-[13px] leading-[19px] text-warn">
                Zone <strong>sur devis</strong> : proposez les frais de livraison dans la discussion. La commande ne peut être confirmée qu&apos;après l&apos;accord du client, qui peut annuler sans frais d&apos;ici là.
              </p>
            )}
            <dl className="space-y-3 text-[13px]">
              {order.pickup ? (
                <div>
                  <dt className="text-ink-3">Retrait sur place</dt>
                  <dd className="mt-0.5 font-semibold">
                    {order.pickupAddress ?? "—"}
                    {order.address && <span className="block font-normal text-ink-2">Contact : {order.address.recipient} · {order.address.phone}</span>}
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="text-ink-3">Adresse de livraison</dt>
                  <dd className="mt-0.5 font-semibold">{order.deliveryAddress ?? "—"}</dd>
                </div>
              )}
              {order.shippingFee != null && (
                <div>
                  <dt className="text-ink-3">Frais de livraison{order.shippingZone && !order.pickup ? ` · ${order.shippingZone}` : ""}</dt>
                  <dd className="mt-0.5 font-semibold">
                    {shippingFeeLabel(order, formatPrice)}
                    {order.deliveryEstimate && <span className="font-normal text-ink-2"> · {order.deliveryEstimate}</span>}
                  </dd>
                </div>
              )}
              <div>
                <dt className="flex items-center gap-1.5 text-ink-3"><Wallet3 size={14} /> Mode de paiement choisi</dt>
                <dd className="mt-0.5 font-semibold">{order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : "—"}</dd>
              </div>
              {(order.status === "livree" || order.status === "retournee") && (
                <div>
                  <dt className="text-ink-3">Reçu de livraison</dt>
                  <dd className="mt-0.5">
                    <a href={api.url(ENDPOINTS.admin.orders.receipt(order.id))} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">Télécharger le reçu signé (PDF)</a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-ink-3">Note du client</dt>
                <dd className="mt-0.5 rounded-md bg-page/60 px-3 py-2 italic text-ink-2">{order.note ?? "Aucune note."}</dd>
              </div>
            </dl>
          </Card>

          {order.refundStatus && <RefundCard order={order} />}

          {(order.status === "en_livraison" || !!order.deliveryAttempts?.length) && <AttemptsCard order={order} />}

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
      {/* réserve la place de la barre d'actions fixe (mobile) pour que le dernier bloc reste visible */}
      <div className="h-20 lg:hidden" aria-hidden />
    </>
  );
}

/** Livraisons manquées : liste, et pour le revendeur en charge (ou l'équipe) l'enregistrement d'un échec. */
function AttemptsCard({ order }: { order: Order }) {
  const canRecord = useCan("orders.status.advance") && order.status === "en_livraison";
  const record = useRecordAttempt(order.id);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<AttemptReason>("client_absent");
  const [note, setNote] = useState("");
  const attempts = order.deliveryAttempts ?? [];
  const submit = () =>
    record.mutate(
      { reason, note },
      {
        onSuccess: (updated) => {
          setOpen(false);
          setNote("");
          if (updated.status === "annulee") toast.info("Commande annulée", "Deux jours ouvrables de livraison manquée : la commande est annulée.");
          else toast.success("Tentative enregistrée", "Le client est prévenu ; repassez un autre jour ouvrable.");
        },
        onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
      },
    );
  return (
    <Card title="Tentatives de livraison" icon={<Truck size={17} variant="Bold" />} delay={0.05}>
      {attempts.length === 0 ? (
        <p className="text-[13px] text-ink-3">Aucune tentative manquée.</p>
      ) : (
        <ul className="space-y-1.5 text-[13px]">
          {attempts.map((a) => (
            <li key={a.at} className="rounded-md bg-page/60 px-3 py-2">
              <span className="font-semibold">{a.reasonLabel}</span> · {formatDateTime(a.at)}
              {a.note && <span className="block text-ink-2">« {a.note} »</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[12px] leading-[17px] text-ink-3">Deux jours ouvrables (lundi à samedi) de livraison manquée annulent la commande ; une commande payée est remboursée sans les frais de livraison.</p>
      {canRecord && !open && (
        <Button size="sm" variant="outline" upper={false} fullWidth className="mt-3" onClick={() => setOpen(true)}>Enregistrer une tentative échouée</Button>
      )}
      {canRecord && open && (
        <div className="mt-3 space-y-3">
          <Select label="Motif" value={reason} onChange={(e) => setReason(e.target.value as AttemptReason)} options={ATTEMPT_REASONS} />
          <Input label="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : personne au domicile à 14 h" maxLength={300} />
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="chip" upper={false} onClick={() => setOpen(false)}>Retour</Button>
            <Button size="sm" upper={false} loading={record.isPending} onClick={submit}>Enregistrer</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/** Commande payée puis annulée : montant à rendre sous 72 h, puis trace du remboursement. */
function RefundCard({ order }: { order: Order }) {
  const canRefund = useCan("orders.refund");
  const record = useRecordRefund(order.id);
  const [note, setNote] = useState("");
  const amount = formatPrice(order.refundDue ?? 0);
  return (
    <Card title={order.refundStatus === "done" ? "Remboursée" : "Remboursement à effectuer"} icon={<Wallet3 size={17} variant="Bold" />} delay={0.05}>
      {order.refundStatus === "done" ? (
        <p className="text-[13px] leading-[19px] text-ink-2">
          <strong className="text-ink">{amount}</strong> rendus au client{order.refundedAt && <> le {formatDateTime(order.refundedAt)}</>}.
          {order.refundNote && <span className="mt-1 block">Référence : {order.refundNote}</span>}
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-[13px] leading-[19px] text-ink-2">
            Commande annulée après paiement : <strong className="text-ink">{amount}</strong> à rendre au client sous 72 h (politique de livraison).
          </p>
          {canRefund && (
            <>
              <Input label="Référence (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. transaction Mobile Money" maxLength={200} />
              <Button
                size="sm"
                upper={false}
                fullWidth
                loading={record.isPending}
                onClick={() =>
                  record.mutate(note, {
                    onSuccess: () => toast.success("Remboursement enregistré", `Le client est prévenu (${amount}).`),
                    onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
                  })
                }
              >
                Marquer comme remboursée
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
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
          {canAssign && <Button size="sm" variant="chip" upper={false} onClick={onAssign}>Réassigner</Button>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-ink-3">Aucun revendeur assigné.</p>
          {canAssign && <Button size="sm" upper={false} onClick={onAssign}>Assigner</Button>}
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
