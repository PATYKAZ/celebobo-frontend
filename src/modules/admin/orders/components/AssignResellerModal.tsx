"use client";

import { AnimatePresence, motion } from "motion/react";
import { SearchNormal1, TickCircle } from "iconsax-reactjs";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { getErrorMessage } from "@/shared/lib/api";
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

interface Props {
  order: Order | null;
  onClose: () => void;
}

/** Assignation / réassignation : tous les revendeurs, recherche, disponibilité, charge, inactifs désactivés. */
export function AssignResellerModal({ order, onClose }: Props) {
  const open = !!order;
  const { data, isLoading } = useResellerOptions(open);
  const assign = useAssignOrder();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const reassign = !!order?.assignedRevendeur;

  useEffect(() => {
    if (open) {
      setQ("");
      setPicked(null);
      setNote("");
    }
  }, [open, order?.id]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => !s || `${r.name} ${r.code}`.toLowerCase().includes(s))
      .sort((a, b) => Number(b.active) - Number(a.active) || RANK[a.availability] - RANK[b.availability] || a.openOrders - b.openOrders || a.name.localeCompare(b.name));
  }, [data, q]);

  const disabledReason = (r: ResellerOption) => (!r.active ? "Compte désactivé" : r.id === order?.assignedRevendeur?.id ? "Déjà assigné" : null);

  const submit = () => {
    if (!order || picked == null) return;
    assign.mutate(
      { orderId: order.id, resellerId: picked, note: note.trim() || undefined },
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
      <Input placeholder="Rechercher par nom ou code…" value={q} onChange={(e) => setQ(e.target.value)} leftIcon={<SearchNormal1 size={16} />} aria-label="Rechercher un revendeur" />
      <p className="mt-3 text-[12px] text-ink-3">{data ? `${data.filter((r) => r.active).length} revendeurs actifs sur ${data.length}` : "Chargement…"} · triés par disponibilité puis par charge</p>

      <ul className="mt-2 max-h-[340px] space-y-1 overflow-y-auto pr-1">
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
                className={cn("flex w-full items-center gap-3 rounded-box border p-2.5 text-left transition-colors", on ? "border-primary bg-primary-50" : "border-transparent hover:bg-chip", reason && "cursor-not-allowed opacity-50 hover:bg-transparent")}
              >
                <Avatar src={r.avatar} name={r.name} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-semibold">{r.name}</span>
                    <span className="rounded bg-chip px-1.5 text-[11px] font-bold tracking-wider text-ink-2">{r.code}</span>
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
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
        <Button upper={false} disabled={picked == null} loading={assign.isPending} onClick={submit}>{reassign ? "Réassigner" : "Assigner"}</Button>
      </div>
    </Modal>
  );
}
