"use client";

import { CloseCircle, Refresh2, TickCircle, Truck, Wallet3 } from "iconsax-reactjs";
import { useState, type ReactNode } from "react";
import { getErrorMessage } from "@/shared/lib/api";
import { Button, type ButtonVariant } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useSetOrderStatus } from "@/modules/orders/hooks/useOrderWorkflow";
import { orderWorkflow } from "@/modules/orders/services/workflow.service";
import { nextOrderStatus, ORDER_FINAL, ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/modules/orders/types";

interface ActionDef {
  label: string;
  confirm: string;
  variant: ButtonVariant;
  icon: ReactNode;
  noteRequired?: boolean;
}

const ACTIONS: Partial<Record<OrderStatus, ActionDef>> = {
  confirmee: { label: "Confirmer la commande", confirm: "Le client est contacté et la commande est confirmée.", variant: "primary", icon: <TickCircle size={16} variant="Bold" /> },
  payee: { label: "Marquer payée", confirm: "Le paiement a bien été reçu (mobile money ou cash).", variant: "primary", icon: <Wallet3 size={16} variant="Bold" /> },
  en_livraison: { label: "Passer en livraison", confirm: "La commande part en livraison chez le client.", variant: "primary", icon: <Truck size={16} variant="Bold" /> },
  livree: { label: "Marquer livrée", confirm: "Le client a reçu sa commande.", variant: "primary", icon: <TickCircle size={16} variant="Bold" /> },
  annulee: { label: "Annuler la commande", confirm: "Cette action clôture la commande. Indiquez le motif.", variant: "danger", icon: <CloseCircle size={16} variant="Bold" />, noteRequired: true },
  retournee: { label: "Enregistrer un retour", confirm: "La commande livrée est retournée par le client. Indiquez le motif.", variant: "dark", icon: <Refresh2 size={16} variant="Bold" />, noteRequired: true },
};

/** Barre d'actions de statut : étape suivante + annulation + retour, désactivées avec l'explication si le rôle ne le permet pas. */
export function StatusActionBar({ order, onAssign }: { order: Order; onAssign?: () => void }) {
  const { user } = useAuth();
  const set = useSetOrderStatus();
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState("");

  const candidates: OrderStatus[] = [];
  const next = order.status === "attente" ? null : nextOrderStatus(order.status);
  if (next) candidates.push(next);
  if (!ORDER_FINAL.includes(order.status)) candidates.push("annulee");
  if (order.status === "livree") candidates.push("retournee");

  const def = pending ? ACTIONS[pending] : undefined;
  const close = () => {
    setPending(null);
    setNote("");
  };
  const submit = () => {
    if (!pending) return;
    set.mutate(
      { orderId: order.id, to: pending, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`Statut : ${ORDER_STATUS_LABEL[pending]}`, `Commande #${order.id}`);
          close();
        },
        onError: (e) => toast.error("Changement impossible", getErrorMessage(e)),
      },
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {order.status === "attente" && onAssign && (
          <Button size="sm" upper={false} onClick={onAssign}>Assigner à un revendeur</Button>
        )}
        {candidates.map((s) => {
          const a = ACTIONS[s];
          if (!a) return null;
          const t = orderWorkflow.canTransition(user, order, s);
          return (
            <span key={s} title={t.ok ? undefined : t.reason}>
              <Button size="sm" upper={false} variant={t.ok ? a.variant : "chip"} disabled={!t.ok} leftIcon={a.icon} onClick={() => setPending(s)}>
                {a.label}
              </Button>
            </span>
          );
        })}
        {candidates.length === 0 && order.status !== "attente" && <p className="text-[13px] text-ink-3">Commande clôturée — aucune action possible.</p>}
      </div>

      <Modal open={!!pending} onClose={close} title={def?.label} className="max-w-[460px]">
        <p className="text-[14px] leading-[22px] text-ink-2">{def?.confirm}</p>
        <Textarea label={def?.noteRequired ? "Motif" : "Note (optionnel)"} required={def?.noteRequired} value={note} onChange={(e) => setNote(e.target.value)} className="mt-3 min-h-[80px]" wrapperClassName="mt-3" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="chip" upper={false} onClick={close}>Retour</Button>
          <Button variant={def?.variant ?? "primary"} upper={false} loading={set.isPending} disabled={!!def?.noteRequired && note.trim().length < 3} onClick={submit}>Confirmer</Button>
        </div>
      </Modal>
    </>
  );
}
