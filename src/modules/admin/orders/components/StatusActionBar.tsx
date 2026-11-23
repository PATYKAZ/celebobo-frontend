"use client";

import { CloseCircle, Refresh2, TickCircle, Truck, Wallet3 } from "@/shared/ui/icons";
import { useState, type ReactNode } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { Button, type ButtonVariant } from "@/shared/ui/Button";
import { Input, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { can } from "@/modules/auth/permissions";
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
  livree: { label: "Marquer livrée", confirm: "Saisissez le code de livraison que le client vous donne une fois sa commande en main.", variant: "primary", icon: <TickCircle size={16} variant="Bold" /> },
  annulee: { label: "Annuler la commande", confirm: "Cette action clôture la commande. Indiquez le motif.", variant: "danger", icon: <CloseCircle size={16} variant="Bold" />, noteRequired: true },
  retournee: { label: "Enregistrer un retour", confirm: "La commande livrée est retournée par le client. Indiquez le motif.", variant: "secondary", icon: <Refresh2 size={16} variant="Bold" />, noteRequired: true },
};

/** Barre d'actions de statut : étape suivante + annulation + retour, désactivées avec l'explication si le rôle ne le permet pas. */
export function StatusActionBar({ order, onAssign }: { order: Order; onAssign?: () => void }) {
  const { user } = useAuth();
  const set = useSetOrderStatus();
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [reason, setReason] = useState("");
  const [codeError, setCodeError] = useState<string>();
  // responsable / admin : peut confirmer sans le code du client, avec un motif (journal d'audit)
  const staff = can(user, "orders.status.any");
  const delivering = pending === "livree";
  const locked = !!order.deliveryCodeLocked;

  const candidates: OrderStatus[] = [];
  const next = order.status === "attente" ? null : nextOrderStatus(order.status);
  if (next) candidates.push(next);
  if (!ORDER_FINAL.includes(order.status)) candidates.push("annulee");
  if (order.status === "livree") candidates.push("retournee");

  const def = pending ? ACTIONS[pending] : undefined;
  const close = () => {
    setPending(null);
    setNote("");
    setCode("");
    setReason("");
    setCodeError(undefined);
  };
  const cleanCode = code.replace(/\s/g, "");
  const submit = () => {
    if (!pending) return;
    set.mutate(
      { orderId: order.id, to: pending, note: note.trim() || undefined, deliveryCode: delivering ? cleanCode : undefined, reason: delivering ? reason.trim() : undefined },
      {
        onSuccess: () => {
          toast.success(`Statut : ${ORDER_STATUS_LABEL[pending]}`, `Commande #${order.id}`);
          close();
        },
        onError: (e) => {
          if (delivering && e instanceof ApiError) {
            const left = (e.meta as { attemptsLeft?: number } | undefined)?.attemptsLeft;
            setCodeError(left != null ? `Code incorrect : encore ${left} essai${left > 1 ? "s" : ""}.` : getErrorMessage(e));
            return;
          }
          toast.error("Changement impossible", getErrorMessage(e));
        },
      },
    );
  };
  // livrée : le code du client (6 chiffres), ou pour l'équipe un motif sans code
  const deliveryReady = /^\d{6}$/.test(cleanCode) ? !locked : staff && reason.trim().length >= 3;

  // actions réellement possibles → barre fixe en bas sur mobile (action principale + icônes pour annuler / retour)
  const doable = candidates.filter((s) => ACTIONS[s] && orderWorkflow.canTransition(user, order, s).ok);
  const primary = doable.find((s) => ACTIONS[s]?.variant === "primary");
  const secondary = doable.filter((s) => s !== primary);
  const showAssign = order.status === "attente" && !!onAssign;
  const hasMobileBar = showAssign || doable.length > 0;

  return (
    <>
      {/* Mobile (< lg) : barre fixe au-dessus de la barre d'onglets */}
      {hasMobileBar && (
        <>
          <div className="fixed inset-x-0 bottom-[max(var(--tabbar-h),env(safe-area-inset-bottom))] z-40 flex items-center gap-2 border-t border-line-3 bg-surface/95 px-4 py-3 backdrop-blur-xl lg:hidden">
            {secondary.map((s) => {
              const a = ACTIONS[s]!;
              return (
                <button key={s} type="button" aria-label={a.label} title={a.label} onClick={() => setPending(s)} className={`grid size-12 shrink-0 place-items-center rounded-box active:scale-95 ${a.variant === "danger" ? "bg-danger-100 text-danger" : "bg-ink-dark text-white"}`}>
                  {a.icon}
                </button>
              );
            })}
            {showAssign && <Button upper={false} onClick={onAssign} className="flex-1">Assigner à un revendeur</Button>}
            {primary && <Button upper={false} leftIcon={ACTIONS[primary]!.icon} onClick={() => setPending(primary)} className="flex-1">{ACTIONS[primary]!.label}</Button>}
          </div>
        </>
      )}

      <div className="hidden flex-wrap items-center gap-2 lg:flex">
        {order.status === "attente" && onAssign && (
          <Button size="sm" upper={false} onClick={onAssign}>Assigner à un revendeur</Button>
        )}
        {candidates.map((s) => {
          const a = ACTIONS[s];
          if (!a) return null;
          const t = orderWorkflow.canTransition(user, order, s);
          return (
            <span key={s} title={t.ok ? undefined : t.reason}>
              <Button size="sm" upper={false} variant={t.ok ? a.variant : "secondary"} disabled={!t.ok} leftIcon={a.icon} onClick={() => setPending(s)}>
                {a.label}
              </Button>
            </span>
          );
        })}
        {candidates.length === 0 && order.status !== "attente" && <p className="text-sm text-ink-3">Commande clôturée — aucune action possible.</p>}
      </div>
      {candidates.length === 0 && order.status !== "attente" && <p className="text-sm text-ink-3 lg:hidden">Commande clôturée — aucune action possible.</p>}

      <Modal open={!!pending} onClose={close} title={def?.label} className="max-w-[460px]">
        {delivering ? (
          <div className="space-y-3">
            {locked ? (
              <p className="rounded-md bg-danger-50 px-3 py-2.5 text-sm text-danger">
                Code bloqué après trop d&apos;erreurs. {staff ? "Vérifiez avec le client, puis confirmez la livraison avec un motif." : "Un responsable doit confirmer la livraison."}
              </p>
            ) : (
              <>
                <p className="text-sm text-ink-2">{def?.confirm}</p>
                <Input
                  label="Code de livraison"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCodeError(undefined);
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={7}
                  placeholder="6 chiffres"
                  error={codeError}
                  className="text-center text-lg"
                  autoFocus
                />
              </>
            )}
            {staff && (
              <Textarea
                label={locked ? "Motif" : "Pas de code ? Motif (responsable)"}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex. client joint par téléphone, remise confirmée"
                className="min-h-[72px]"
                hint="Sans code, la confirmation est enregistrée dans le journal d'audit avec ce motif."
              />
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-2">{def?.confirm}</p>
            <Textarea label={def?.noteRequired ? "Motif" : "Note (optionnel)"} required={def?.noteRequired} value={note} onChange={(e) => setNote(e.target.value)} className="mt-3 min-h-[80px]" wrapperClassName="mt-3" />
          </>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" upper={false} onClick={close}>Retour</Button>
          <Button
            variant={def?.variant ?? "primary"}
            upper={false}
            loading={set.isPending}
            disabled={delivering ? !deliveryReady : !!def?.noteRequired && note.trim().length < 3}
            onClick={submit}
          >
            Confirmer
          </Button>
        </div>
      </Modal>
    </>
  );
}
