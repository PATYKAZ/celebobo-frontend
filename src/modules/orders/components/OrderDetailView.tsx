"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft2, CloseCircle, Location, Messages2, Note1, Profile, Wallet3 } from "iconsax-reactjs";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { useRealtime } from "@/shared/hooks/useRealtime";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { formatDateTime, formatPrice, pluralize } from "@/shared/lib/format";
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
import { useOrder, orderKeys } from "../hooks/useOrders";
import { useResellerAvailability } from "../hooks/useResellerAvailability";
import { useSetOrderStatus } from "../hooks/useOrderWorkflow";
import { canTransition } from "../services/workflow.service";
import { ORDER_STATUS_LABEL, PAYMENT_METHODS } from "../types";
import { AvailabilityDot } from "./AvailabilityDot";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderProgress, OrderTimeline } from "./OrderTimeline";

const CANCEL_REASONS = ["Changement d'avis", "Prix trouvé moins cher ailleurs", "Délai trop long", "Commande passée par erreur", "Autre"];

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-chip text-ink-2">{icon}</span>
      <div className="min-w-0">
        <p className="text-[12px] uppercase tracking-wide text-ink-3">{label}</p>
        <div className="text-[14px] font-semibold leading-[20px]">{children}</div>
      </div>
    </div>
  );
}

/** Page détail d'une commande (espace client) : suivi en temps réel, annulation tant qu'elle est en attente. */
export function OrderDetailView({ id }: { id: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: order, isLoading, error } = useOrder(id);
  const setStatus = useSetOrderStatus();
  const availability = useResellerAvailability(order?.assignedRevendeur?.id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [details, setDetails] = useState("");

  // Temps réel : tout changement de statut de MA commande rafraîchit la page.
  useRealtime<UserEvent>(user ? channels.user(user.id) : null, (e) => {
    if (e.type === "order.status" && e.orderId === id) {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      toast.info("Votre commande a évolué", `Nouveau statut : ${ORDER_STATUS_LABEL[e.status as keyof typeof ORDER_STATUS_LABEL] ?? e.status}`);
    }
  });

  const crumbs = [{ label: "Mes commandes", href: ROUTES.orders }, { label: `Commande #${id}` }];

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
  const cancel = canTransition(user, order, "annulee");
  const payment = PAYMENT_METHODS.find((p) => p.value === order.paymentMethod)?.label;

  const confirmCancel = () =>
    setStatus.mutate(
      { orderId: order.id, to: "annulee", note: details.trim() ? `${reason} — ${details.trim()}` : reason },
      {
        onSuccess: () => {
          setCancelOpen(false);
          toast.success("Commande annulée", `La commande #${order.id} a bien été annulée.`);
        },
        onError: (e) => toast.error("Annulation impossible", getErrorMessage(e)),
      },
    );

  return (
    <>
      <Breadcrumb items={crumbs} />

      <Reveal>
        <Block pad="none" className="p-4 sm:p-[30px]">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <Link href={ROUTES.orders} className="mb-1 inline-flex min-h-9 items-center gap-1 text-[13px] text-ink-3 hover:text-primary sm:mb-2"><ArrowLeft2 size={14} /> Toutes mes commandes</Link>
              <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[22px] leading-[28px] sm:text-h-page">Commande #{order.id} <OrderStatusBadge status={order.status} /></h1>
              <p className="mt-1 text-[13px] leading-[19px] text-ink-2 sm:text-[14px]">Passée le {formatDateTime(order.createdAt)} · {pluralize(count, "article")} · <strong className="text-ink">{formatPrice(order.totalPrice)}</strong></p>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {order.conversationId && <Button href={ROUTES.conversation(order.conversationId)} leftIcon={<Messages2 size={16} variant="Bold" />} className="max-sm:hidden">Ouvrir la discussion</Button>}
              {cancel.ok && <Button variant="danger" upper={false} onClick={() => setCancelOpen(true)} className="max-sm:w-full">Annuler la commande</Button>}
            </div>
          </div>

          <div className="mt-5 md:hidden"><OrderProgress status={order.status} /></div>
          <div className="mt-8 hidden md:block"><OrderTimeline order={order} /></div>
          {order.status === "attente" && (
            <p className="mt-4 rounded-md bg-star/10 px-3.5 py-3 text-[13px] leading-[19px] text-[#8a5a00] sm:mt-6 sm:px-4">
              Votre commande est <strong>en attente d&apos;assignation</strong>. Vous pouvez encore l&apos;annuler tant qu&apos;un revendeur ne l&apos;a pas prise en charge.
            </p>
          )}
        </Block>
      </Reveal>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Reveal className="min-w-0">
          <Block pad="none" className="p-4 sm:p-[30px]">
            <h2 className="text-[16px] uppercase sm:text-section">Articles</h2>
            <ul className="mt-2 divide-y divide-line-3 sm:mt-4">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-3.5 sm:gap-4 sm:py-4">
                  <span className="relative size-16 shrink-0 sm:size-[72px] overflow-hidden rounded-box bg-page">
                    {it.productImage && <Image src={it.productImage} alt="" fill sizes="72px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {it.productSlug ? <Link href={ROUTES.product(it.productSlug)} className="line-clamp-2 text-[14px] font-bold leading-[19px] hover:text-primary sm:text-[15px] sm:leading-[20px]">{it.productName}</Link> : <p className="text-[14px] font-bold sm:text-[15px]">{it.productName}</p>}
                    {it.variantLabel && <p className="mt-0.5 inline-block rounded bg-chip px-2 py-0.5 text-[12px] font-semibold">{it.variantLabel}</p>}
                    <p className="mt-1 text-[13px] text-ink-3">{formatPrice(it.unitPrice)} × {it.quantity}</p>
                  </div>
                  <p className="text-[15px] font-bold sm:text-[16px]">{formatPrice(it.unitPrice * it.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-line-3 pt-4">
              <span className="text-[14px] font-semibold text-ink-2">Total</span>
              <span className="text-[22px] font-bold text-primary sm:text-[24px]">{formatPrice(order.totalPrice)}</span>
            </div>
          </Block>
        </Reveal>

        <div className="min-w-0 space-y-3 sm:space-y-4">
          <Reveal delay={0.05}>
            <Block pad="none" className="space-y-4 p-4 sm:space-y-5 sm:p-[30px]">
              <h2 className="text-[16px] uppercase sm:text-section">Informations</h2>
              <InfoRow icon={<Profile size={18} />} label="Revendeur">
                {order.assignedRevendeur ? <span className="flex items-center gap-2">{order.assignedRevendeur.name} <AvailabilityDot value={availability} withLabel /></span> : <span className="font-normal text-ink-2">Pas encore assigné</span>}
              </InfoRow>
              <InfoRow icon={<Location size={18} />} label="Livraison">{order.deliveryAddress ?? <span className="font-normal text-ink-2">À préciser dans la discussion</span>}</InfoRow>
              <InfoRow icon={<Wallet3 size={18} />} label="Paiement">{payment ?? <span className="font-normal text-ink-2">À convenir avec le revendeur</span>}</InfoRow>
              {order.note && <InfoRow icon={<Note1 size={18} />} label="Votre note"><span className="font-normal italic">« {order.note} »</span></InfoRow>}
            </Block>
          </Reveal>
          <Reveal delay={0.1}>
            <Block pad="none" className="p-4 sm:p-[30px]">
              <h2 className="mb-4 text-[16px] uppercase sm:mb-5 sm:text-section">Historique</h2>
              <OrderTimeline order={order} layout="vertical" />
            </Block>
          </Reveal>
        </div>
      </div>

      {/* Mobile : accès direct à la discussion */}
      {order.conversationId && (
        <>
          <div aria-hidden className="h-20 lg:hidden" />
          <div className="fixed inset-x-0 bottom-tabbar z-40 border-t border-line-3 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-xl sm:hidden">
            <Button href={ROUTES.conversation(order.conversationId)} size="lg" fullWidth leftIcon={<Messages2 size={17} variant="Bold" />}>Ouvrir la discussion</Button>
          </div>
        </>
      )}

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Annuler la commande" className="max-w-[460px]">
        <p className="mb-4 text-[14px] leading-[21px] text-ink-2">Dites-nous pourquoi : cela nous aide à nous améliorer. Cette action est définitive.</p>
        <div className="space-y-4">
          <Select label="Motif" value={reason} onChange={(e) => setReason(e.target.value)} options={CANCEL_REASONS.map((r) => ({ value: r, label: r }))} />
          <Textarea label="Précisions (facultatif)" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Ajoutez un commentaire…" className="min-h-[90px]" />
          <div className="flex flex-col-reverse gap-2.5 sm:grid sm:grid-cols-2 sm:gap-3">
            <Button variant="chip" upper={false} onClick={() => setCancelOpen(false)}>Garder la commande</Button>
            <Button variant="danger" upper={false} loading={setStatus.isPending} onClick={confirmCancel}>Confirmer</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
