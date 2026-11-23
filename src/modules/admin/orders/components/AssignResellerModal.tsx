"use client";

import { AnimatePresence, motion } from "motion/react";
import { SearchNormal1, TickCircle, UserTick } from "@/shared/ui/icons";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { getErrorMessage } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Input, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { useAssignOrder } from "@/modules/orders/hooks/useOrderWorkflow";
import type { Order } from "@/modules/orders/types";
import { useResellerOptions } from "../hooks/useAdminOrders";
import type { ResellerOption } from "../types";
import { AvailabilityDot } from "./parts";

const RANK = { online: 0, away: 1, offline: 2 } as const;

/** Pourquoi ce revendeur ne peut pas recevoir de nouvelle commande (sanction ou argent à reverser). */
const blockedReason = (r: ResellerOption): string | null =>
  r.suspendedUntil ? `Suspendu jusqu'au ${formatDate(r.suspendedUntil)}` : r.cashBlocked ? `Argent à reverser : ${r.cashBlocked}` : null;

interface Props {
  order: Order | null;
  onClose: () => void;
}

/** Assignation / réassignation : le revendeur qui a invité le client en premier (suggéré), puis tous les revendeurs, recherche, disponibilité, charge, inactifs désactivés. */
export function AssignResellerModal({ order, onClose }: Props) {
  const open = !!order;
  const { data, isLoading } = useResellerOptions(open);
  const assign = useAssignOrder();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const reassign = !!order?.assignedRevendeur;
  // l'API ne renvoie la suggestion que si l'inviteur est un revendeur actif
  const suggested = order?.suggestedReseller && order.suggestedReseller.id !== order.assignedRevendeur?.id ? order.suggestedReseller : null;

  // un revendeur suspendu, ou qui doit d'abord reverser l'argent encaissé, ne reçoit pas de nouvelle commande
  const suggestedOption = suggested ? (data ?? []).find((r) => r.id === suggested.id) : undefined;
  const suggestedBlocked = suggestedOption ? blockedReason(suggestedOption) : null;

  useEffect(() => {
    if (open) {
      setQ("");
      setPicked(suggestedBlocked ? null : (suggested?.id ?? null));
      setNote("");
    }
  }, [open, order?.id, suggested?.id, suggestedBlocked]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => !s || `${r.name} ${r.code}`.toLowerCase().includes(s))
      .sort((a, b) => Number(b.id === suggested?.id) - Number(a.id === suggested?.id) || Number(b.active) - Number(a.active) || RANK[a.availability] - RANK[b.availability] || a.openOrders - b.openOrders || a.name.localeCompare(b.name));
  }, [data, q, suggested?.id]);

  const disabledReason = (r: ResellerOption) => (!r.active ? "Compte désactivé" : r.id === order?.assignedRevendeur?.id ? "Déjà assigné" : blockedReason(r));

  const submit = (resellerId = picked) => {
    if (!order || resellerId == null) return;
    assign.mutate(
      { orderId: order.id, resellerId, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(reassign ? "Commande réassignée" : "Commande assignée", `Commande #${order.id}`);
          onClose();
        },
        onError: (e) => toast.error("Assignation impossible", getErrorMessage(e)),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={order ? `${reassign ? "Réassigner" : "Assigner"} la commande #${order.id}` : undefined} className="max-w-[560px]">
      {suggested && (
        <div className="mb-3 flex items-center gap-3 rounded-box border border-primary bg-primary-50 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white"><UserTick size={18} variant="Bold" /></span>
          <span className="min-w-0 flex-1 text-[13px]">
            <span className="block font-semibold">Invité par {suggested.name} — suggéré</span>
            <span className="block text-ink-3">{suggested.invitedAt ? `Client invité le ${formatDate(suggested.invitedAt)}` : "Revendeur qui a invité ce client"}</span>
            {suggestedBlocked && <span className="block text-danger">{suggestedBlocked}</span>}
          </span>
          {!suggestedBlocked && <Button size="sm" upper={false} disabled={assign.isPending} onClick={() => submit(suggested.id)}>{reassign ? "Réassigner" : "Assigner"}</Button>}
        </div>
      )}
      <Input placeholder="Rechercher par nom ou code…" inputMode="search" value={q} onChange={(e) => setQ(e.target.value)} leftIcon={<SearchNormal1 size={16} />} aria-label="Rechercher un revendeur" />
      <p className="mt-3 text-[12px] text-ink-3">{data ? `${data.filter((r) => r.active).length} revendeurs actifs sur ${data.length}` : "Chargement…"} · triés par disponibilité puis par charge</p>

      <ul className="mt-2 max-h-[calc(var(--dvh)*40)] space-y-1 overflow-y-auto overscroll-contain pr-1 sm:max-h-[340px]">
        {isLoading && Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        {list.map((r) => {
          const reason = disabledReason(r);
          const on = picked === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                disabled={!!reason}
                onClick={() => setPicked(r.id)}
                aria-pressed={on}
                title={reason ?? undefined}
                className={cn("flex min-h-14 w-full items-center gap-3 rounded-box border p-2.5 text-left transition-colors active:bg-chip", on ? "border-primary bg-primary-50" : "border-transparent hover:bg-chip", reason && "cursor-not-allowed opacity-50 hover:bg-transparent")}
              >
                <Avatar src={r.avatar} name={r.name} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-semibold">{r.name}</span>
                    <span className="rounded-sm bg-chip px-1.5 text-[11px] font-bold tracking-wider text-ink-2">{r.code}</span>
                    {r.id === suggested?.id && <span className="rounded-sm bg-primary-50 px-1.5 text-[11px] font-bold text-primary">Suggéré</span>}
                  </span>
                  <span className="flex items-center gap-3 text-[12px] text-ink-3">
                    <AvailabilityDot value={r.availability} withLabel />
                    <span>{r.openOrders} commande{r.openOrders > 1 ? "s" : ""} en cours</span>
                    {reason && <span className="font-semibold text-danger">{reason}</span>}
                  </span>
                </span>
                <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-primary"><TickCircle size={22} variant="Bold" /></motion.span>}</AnimatePresence>
              </button>
            </li>
          );
        })}
        {!isLoading && list.length === 0 && <li className="py-8 text-center text-[13px] text-ink-3">Aucun revendeur ne correspond.</li>}
      </ul>

      <Textarea label="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} className="mt-4 min-h-[70px]" placeholder="Consigne pour le revendeur…" />
      <div className="sticky bottom-0 -mx-5 mt-4 grid grid-cols-[1fr_1.5fr] gap-3 border-t border-line-3 bg-surface px-5 py-3 sm:static sm:mx-0 sm:mt-5 sm:grid-cols-2 sm:border-0 sm:p-0">
        <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
        <Button upper={false} disabled={picked == null} loading={assign.isPending} onClick={() => submit()}>{reassign ? "Réassigner" : "Assigner"}</Button>
      </div>
    </Modal>
  );
}
