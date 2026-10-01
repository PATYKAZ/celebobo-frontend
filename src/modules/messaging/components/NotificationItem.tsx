"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight2, Box, CloseCircle, MessageText1, TickCircle } from "iconsax-reactjs";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatRelative } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import type { UserRole } from "@/modules/auth/types";
import { useAssignReseller, useMarkNotificationRead, useRevendeurReply } from "../hooks/useNotifications";
import type { ResellerOption } from "../services/notifications.service";
import type { Notification } from "../types";

interface Props {
  notification: Notification;
  role: UserRole;
  resellers: ResellerOption[];
}

export function NotificationItem({ notification: n, role, resellers }: Props) {
  const [revendeurId, setRevendeurId] = useState("");
  const [done, setDone] = useState(false);
  const assign = useAssignReseller();
  const reply = useRevendeurReply();
  const markRead = useMarkNotificationRead();

  const canAssign = (role === "mukubwa" || role === "admin") && !n.isOrderAssigned && (n.type === "order" || n.type === "chat");
  const canReply = role === "revendeur" && n.type === "order" && !n.isRead && n.title.toLowerCase().includes("assignation");
  const Icon = n.type === "order" ? Box : MessageText1;

  const confirmAssign = () => {
    if (!revendeurId) return toast.error("Choisissez un revendeur");
    assign.mutate(
      { notificationId: n.id, revendeurId: Number(revendeurId), discussion: n.type === "chat" },
      {
        onSuccess: () => {
          setDone(true);
          toast.success("Commande assignée", "Le revendeur a été notifié.");
        },
        onError: () => toast.error("Assignation impossible"),
      },
    );
  };

  return (
    <motion.li layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} className={cn("relative rounded-box border p-4 transition-colors sm:p-5", n.isRead ? "border-line-3 bg-white" : "border-primary/30 bg-primary-50")}>
      <div className="flex items-start gap-4">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", n.type === "order" ? "bg-primary-100 text-primary-dark" : "bg-info/10 text-info")}>
          <Icon size={22} variant="Bold" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-[15px] leading-[21px]">{n.title}</h3>
            {!n.isRead && <span className="size-2 rounded-full bg-danger" aria-label="Non lue" />}
            <span className="ml-auto text-[12px] text-ink-3">{formatRelative(n.createdAt)}</span>
          </div>
          <p className="mt-1 text-[14px] leading-[21px] text-ink-2">{n.body}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link href={ROUTES.conversation(n.conversationId)} onClick={() => !n.isRead && markRead.mutate(n.id)} className="group inline-flex items-center gap-1 text-[13px] font-bold text-primary">
              Ouvrir la discussion <ArrowRight2 size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
            {!n.isRead && !canAssign && !canReply && (
              <button onClick={() => markRead.mutate(n.id)} className="ml-3 text-[12px] text-ink-3 hover:text-ink">Marquer comme lue</button>
            )}
            {n.isOrderAssigned && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-bold text-primary-dark"><TickCircle size={13} variant="Bold" /> Assignée</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {canAssign && !done && (
              <motion.div key="assign" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Select
                    label="Assigner à un revendeur"
                    value={revendeurId}
                    onChange={(e) => setRevendeurId(e.target.value)}
                    wrapperClassName="sm:w-[280px]"
                    options={[{ value: "", label: "Sélectionner…" }, ...resellers.map((r) => ({ value: r.id, label: r.name }))]}
                  />
                  <Button size="md" onClick={confirmAssign} loading={assign.isPending} upper={false}>Confirmer</Button>
                </div>
              </motion.div>
            )}
            {done && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-white">
                <motion.span initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 12 }}><TickCircle size={18} variant="Bold" /></motion.span>
                Commande assignée avec succès
              </motion.div>
            )}
            {canReply && (
              <motion.div key="reply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" leftIcon={<TickCircle size={15} variant="Bold" />} loading={reply.isPending} upper={false} onClick={() => reply.mutate({ id: n.id, accept: true }, { onSuccess: () => toast.success("Commande acceptée") })}>Accepter</Button>
                <Button size="sm" variant="chip" leftIcon={<CloseCircle size={15} variant="Bold" />} upper={false} onClick={() => reply.mutate({ id: n.id, accept: false }, { onSuccess: () => toast.info("Commande déclinée") })}>Décliner</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}
