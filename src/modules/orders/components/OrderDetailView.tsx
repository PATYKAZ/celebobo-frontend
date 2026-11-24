"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft2, CloseCircle, DocumentDownload, Location, Messages2, Note1, Profile, ShieldTick, Wallet3 } from "@/shared/ui/icons";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { useRealtime } from "@/shared/hooks/useRealtime";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { formatDateTime, formatPrice, pluralize } from "@/shared/lib/format";
import { formatPointsEarned } from "@/modules/points/types";
import { getErrorMessage } from "@/shared/lib/api";
import { channels, type UserEvent } from "@/shared/lib/realtime";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Select, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { RateResellerCard } from "./RateResellerCard";
import { orderInvoiceUrl, orderReceiptUrl, useCancelOrder, useOrder, orderKeys } from "../hooks/useOrders";
import { useResellerAvailability } from "../hooks/useResellerAvailability";
import { toStatus } from "../services/orders.mapper";
import { CANCEL_REASONS, ORDER_FINAL, ORDER_STATUS_LABEL, PAYMENT_METHODS, shippingFeeLabel, type CancelReason } from "../types";
import { AvailabilityDot } from "./AvailabilityDot";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderProgress, OrderTimeline } from "./OrderTimeline";

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-chip text-ink-2">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ink-3">{label}</p>
        <div className="text-sm font-semibold">{children}</div>
      </div>
    </div>
  );
}

/** Page détail d'une commande (espace client, par numéro) : suivi en temps réel, annulation tant qu'elle est en attente. */
export function OrderDetailView({ number }: { number: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: order, isLoading, error } = useOrder(number);
  const cancelOrder = useCancelOrder(number);
  const liveAvailability = useResellerAvailability(order?.assignedRevendeur?.id);
  const availability = liveAvailability ?? order?.assignedRevendeur?.availability ?? undefined;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState<CancelReason>(CANCEL_REASONS[0].value);
  const [details, setDetails] = useState("");

  // Temps réel : tout changement de statut de MA commande rafraîchit la page.
  useRealtime<UserEvent>(user ? channels.user(user.id) : null, (e) => {
    if (e.type === "order.status" && order && e.orderId === order.id) {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      toast.info("Votre commande a évolué", `Nouveau statut : ${ORDER_STATUS_LABEL[toStatus(e.status)]}`);
    }
  });

  const crumbs = [{ label: "Mes commandes", href: ROUTES.orders }, { label: `Commande ${number}` }];

  if (isLoading) {
    return (
      <>
        <Breadcrumb items={crumbs} />
        <Block><Skeleton className="h-8 w-60" /><Skeleton className="mt-6 h-24 w-full" /><Skeleton className="mt-6 h-64 w-full" /></Block>
      </>
    );
  }
  if (error || !order) {
    return (
      <>
        <Breadcrumb items={crumbs} />
        <Block>
          <EmptyState icon={<CloseCircle size={40} variant="Bulk" />} title="Commande introuvable" description="Cette commande n'existe pas ou ne vous appartient pas." action={<Button href={ROUTES.orders}>Mes commandes</Button>} />
        </Block>
      </>
    );
  }

  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  const canCancel = order.allowedTransitions?.includes("annulee") ?? false;
  const payment = PAYMENT_METHODS.find((p) => p.value === order.paymentMethod)?.label;
  const address = order.address;

  const confirmCancel = () =>
    cancelOrder.mutate(
      { reason, details: details.trim() },
      {
        onSuccess: () => {
          setCancelOpen(false);
          toast.success("Commande annulée", `La commande ${number} a bien été annulée.`);
        },
        onError: (e) => toast.error("Annulation impossible", getErrorMessage(e)),
      },
    );

  return (
    <>
      <Breadcrumb items={crumbs} />

      <Reveal>
        <Block pad="none" className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <Link href={ROUTES.orders} className="mb-1 inline-flex min-h-9 items-center gap-1 text-sm text-ink-3 hover:text-primary sm:mb-2"><ArrowLeft2 size={14} /> Toutes mes commandes</Link>
              <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xl sm:text-h-page">Commande {order.number} <OrderStatusBadge status={order.status} /></h1>
              <p className="mt-1 text-sm text-ink-2 sm:text-sm">Passée le {formatDateTime(order.createdAt)} · {pluralize(count, "article")} · <strong className="text-ink">{formatPrice(order.totalPrice)}</strong></p>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {order.conversationId && <Button href={ROUTES.conversation(order.conversationId)} leftIcon={<Messages2 size={16} variant="Bold" />} className="max-sm:hidden">Ouvrir la discussion</Button>}
              <Button href={orderInvoiceUrl(number)} target="_blank" variant="secondary" upper={false} leftIcon={<DocumentDownload size={16} />} className="max-sm:flex-1">Facture</Button>
              {(order.status === "livree" || order.status === "retournee") && (
                <Button href={orderReceiptUrl(number)} target="_blank" variant="secondary" upper={false} leftIcon={<DocumentDownload size={16} />} className="max-sm:flex-1">Reçu de livraison</Button>
              )}
              {order.status === "livree" && (
                <Button href={ROUTES.newClaim(order.id)} variant="secondary" upper={false} leftIcon={<ShieldTick size={16} />} className="max-sm:flex-1">Faire une réclamation</Button>
              )}
              {canCancel && <Button variant="danger" upper={false} onClick={() => setCancelOpen(true)} className="max-sm:flex-1">Annuler la commande</Button>}
            </div>
          </div>

          {order.refundStatus && (
            <p className={`mt-4 rounded-md px-3.5 py-3 text-sm sm:px-4 ${order.refundStatus === "done" ? "bg-primary-50 text-primary-dark" : "bg-star/10 text-warn"}`}>
              {order.refundStatus === "done" ? (
                <>
                  <strong>Remboursement effectué</strong> : {formatPrice(order.refundDue ?? 0)}
                  {order.refundedAt && <> le {formatDateTime(order.refundedAt)}</>}.
                </>
              ) : (
                <>
                  <strong>Remboursement en cours</strong> : {formatPrice(order.refundDue ?? 0)} vous seront rendus{" "}
                  {order.cancelReasonCode === "delivery_failed" ? "sous 5 jours ouvrables (frais de livraison déduits)" : "sous 72 heures"}, par le moyen utilisé pour payer.
                </>
              )}
            </p>
          )}
          {order.status === "en_livraison" && !!order.deliveryAttempts?.length && (
            <div className="mt-4 rounded-md bg-star/10 px-3.5 py-3 text-sm text-warn sm:px-4">
              <p><strong>Livraison manquée</strong> : le revendeur n&apos;a pas pu vous livrer.</p>
              <ul className="mt-1 list-disc pl-5">
                {order.deliveryAttempts.map((a) => (
                  <li key={a.at}>{formatDateTime(a.at)} — {a.reasonLabel}{a.note ? ` (${a.note})` : ""}</li>
                ))}
              </ul>
              <p className="mt-1">Il repassera un autre jour ouvrable. Sans livraison possible sur deux jours ouvrables, la commande sera annulée et remboursée, frais de livraison déduits.</p>
            </div>
          )}
          {order.deliveryCode && (
            <div className="mt-4 flex flex-col gap-3 rounded-box border-2 border-dashed border-primary/40 bg-primary-50 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-5">
              <div className="shrink-0">
                <p className="text-xs font-bold text-primary-dark">Code de livraison</p>
                <p className="font-mono text-2xl font-bold text-primary">{order.deliveryCode.slice(0, 3)} {order.deliveryCode.slice(3)}</p>
              </div>
              <p className="text-sm text-ink-2">
                Donnez ce code au revendeur <strong className="text-ink">seulement quand vous avez votre commande en main et en bon état</strong> : c&apos;est lui qui confirme la livraison. Ne le communiquez pas avant.
              </p>
            </div>
          )}
          {/* progression compacte ici ; le détail daté (qui, quand, notes) est dans « Historique » : pas deux frises identiques */}
          <div className="mt-5 sm:mt-4"><OrderProgress status={order.status} /></div>
          {order.awaitingShippingQuote && !ORDER_FINAL.includes(order.status) ? (
            <div className="mt-4 rounded-md bg-star/10 px-3.5 py-3 text-sm text-warn sm:mt-4 sm:px-4">
              <p>
                Votre zone est livrée <strong>sur devis</strong> : un revendeur vous indique le coût et le délai de livraison dans la discussion. Vous ne payez rien avant d&apos;avoir accepté ces frais, et vous pouvez annuler la commande sans frais jusque-là.
              </p>
              {order.conversationId && (
                <Link href={ROUTES.conversation(order.conversationId)} className="mt-1.5 inline-flex min-h-9 items-center gap-1 font-bold text-primary hover:underline">
                  <Messages2 size={15} variant="Bold" /> Voir la discussion
                </Link>
              )}
            </div>
          ) : (
            order.status === "attente" && (
              <p className="mt-4 rounded-md bg-star/10 px-3.5 py-3 text-sm text-warn sm:mt-4 sm:px-4">
                Votre commande est <strong>en attente d&apos;assignation</strong>. Vous pouvez l&apos;annuler sans frais jusqu&apos;à son départ en livraison.
              </p>
            )
          )}
        </Block>
      </Reveal>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Reveal className="min-w-0">
          <Block pad="none" className="p-4 sm:p-5">
            <h2 className="text-base sm:text-section">Articles</h2>
            <ul className="mt-2 divide-y divide-line-3 sm:mt-4">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-3.5 sm:gap-4 sm:py-4">
                  <span className="relative size-16 shrink-0 sm:size-[72px] overflow-hidden rounded-box bg-page">
                    {it.productImage && <Image src={it.productImage} alt="" fill sizes="72px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {it.productSlug ? <Link href={ROUTES.product(it.productSlug)} className="line-clamp-2 text-sm font-bold hover:text-primary sm:text-sm">{it.productName}</Link> : <p className="text-sm font-bold sm:text-sm">{it.productName}</p>}
                    {it.variantLabel && <p className="mt-0.5 inline-block rounded-sm bg-chip px-2 py-0.5 text-xs font-semibold">{it.variantLabel}</p>}
                    {!!it.serials?.length && <p className="mt-1 text-xs text-ink-2">N° de série / IMEI : <span className="font-mono">{it.serials.join(", ")}</span></p>}
                    <p className="mt-1 text-sm text-ink-3">{formatPrice(it.unitPrice)} × {it.quantity}</p>
                  </div>
                  <p className="text-sm font-bold sm:text-base">{formatPrice(it.unitPrice * it.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-2 border-t border-line-3 pt-4 text-sm">
              {order.subtotal != null && <div className="flex justify-between"><dt className="text-ink-2">Sous-total</dt><dd className="font-semibold">{formatPrice(order.subtotal)}</dd></div>}
              {!!order.campaignDiscount && <div className="flex justify-between gap-3"><dt className="text-ink-2">Remise Cagnotte{order.campaignName ? ` · ${order.campaignName}` : ""}</dt><dd className="font-semibold text-danger">-{formatPrice(order.campaignDiscount)}</dd></div>}
              {(order.discount ?? 0) - (order.campaignDiscount ?? 0) > 0 && <div className="flex justify-between"><dt className="text-ink-2">Code promo{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd className="font-semibold text-danger">-{formatPrice((order.discount ?? 0) - (order.campaignDiscount ?? 0))}</dd></div>}
              {!!order.points && <div className="flex justify-between"><dt className="text-ink-2">Points de fidélité utilisés</dt><dd className="font-semibold text-danger">-{formatPrice(order.points)}</dd></div>}
              {!!order.storeCredit && <div className="flex justify-between"><dt className="text-ink-2">Avoir utilisé</dt><dd className="font-semibold text-danger">-{formatPrice(order.storeCredit)}</dd></div>}
              {order.shippingFee != null && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-2">{order.pickup ? "Retrait sur place" : `Livraison${order.shippingZone ? ` · ${order.shippingZone}` : ""}`}</dt>
                  <dd className="text-right font-semibold">
                    {shippingFeeLabel(order, formatPrice)}
                    {order.deliveryEstimate && <span className="block text-xs font-normal text-ink-3">{order.deliveryEstimate}</span>}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <dt className="text-sm font-semibold text-ink-2">Total</dt>
                <dd className="text-xl font-bold text-primary sm:text-xl">{formatPrice(order.totalPrice)}</dd>
              </div>
              {!!order.pointsEarned && <p className="text-right text-sm font-semibold text-primary">+{formatPointsEarned(order.pointsEarned)}</p>}
            </dl>
          </Block>
        </Reveal>

        <div className="min-w-0 space-y-3 sm:space-y-4">
          {(order.canRate || order.rating) && <RateResellerCard order={order} />}
          <Reveal delay={0.05}>
            <Block pad="none" className="space-y-4 p-4 sm:space-y-5 sm:p-5">
              <h2 className="text-base sm:text-section">Informations</h2>
              <InfoRow icon={<Profile size={18} />} label="Revendeur">
                {order.assignedRevendeur ? <span className="flex items-center gap-2">{order.assignedRevendeur.name} <AvailabilityDot value={availability} withLabel /></span> : <span className="font-normal text-ink-2">Pas encore assigné</span>}
              </InfoRow>
              <InfoRow icon={<Location size={18} />} label={order.pickup ? "Retrait sur place" : "Livraison"}>
                {order.pickup ? (
                  <>
                    {order.pickupAddress ?? "Boutique Celebobo"}
                    {address && <span className="block font-normal text-ink-2">Contact : {address.recipient} · {address.phone}</span>}
                  </>
                ) : address ? (
                  <>
                    {address.recipient} · {address.phone}
                    <span className="block font-normal text-ink-2">{order.deliveryAddress}</span>
                  </>
                ) : (
                  <span className="font-normal text-ink-2">À préciser dans la discussion</span>
                )}
              </InfoRow>
              <InfoRow icon={<Wallet3 size={18} />} label="Paiement">{payment ?? <span className="font-normal text-ink-2">À convenir avec le revendeur</span>}</InfoRow>
              {order.note && <InfoRow icon={<Note1 size={18} />} label="Votre note"><span className="font-normal italic">« {order.note} »</span></InfoRow>}
              {order.status === "annulee" && order.cancelReason && <InfoRow icon={<CloseCircle size={18} />} label="Motif d'annulation">{order.cancelReason}</InfoRow>}
            </Block>
          </Reveal>
          <Reveal delay={0.1}>
            <Block pad="none" className="p-4 sm:p-5">
              <h2 className="mb-4 text-base sm:mb-5 sm:text-section">Historique</h2>
              <OrderTimeline order={order} layout="vertical" />
            </Block>
          </Reveal>
        </div>
      </div>

      {/* Mobile : accès direct à la discussion */}
      {order.conversationId && (
        <>
          <div aria-hidden className="h-20 lg:hidden" />
          <div className="fixed inset-x-0 bottom-tabbar z-40 border-t border-line-3 bg-surface/95 px-4 pb-3 pt-3 backdrop-blur-xl sm:hidden">
            <Button href={ROUTES.conversation(order.conversationId)} size="lg" fullWidth leftIcon={<Messages2 size={17} variant="Bold" />}>Ouvrir la discussion</Button>
          </div>
        </>
      )}

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Annuler la commande" className="max-w-[460px]">
        <p className="mb-4 text-sm text-ink-2">
          Dites-nous pourquoi : cela nous aide à nous améliorer. Cette action est définitive.
          {order.status === "payee" && <> Votre paiement de <strong className="text-ink">{formatPrice(order.totalPrice)}</strong> vous sera remboursé sous 72 heures.</>}
        </p>
        <div className="space-y-4">
          <Select label="Motif" value={reason} onChange={(e) => setReason(e.target.value as CancelReason)} options={CANCEL_REASONS} />
          <Textarea label="Précisions (facultatif)" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Ajoutez un commentaire…" className="min-h-[90px]" />
          <div className="flex flex-col-reverse gap-2.5 sm:grid sm:grid-cols-2 sm:gap-3">
            <Button variant="secondary" upper={false} onClick={() => setCancelOpen(false)}>Garder la commande</Button>
            <Button variant="danger" upper={false} loading={cancelOrder.isPending} onClick={confirmCancel}>Confirmer</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
