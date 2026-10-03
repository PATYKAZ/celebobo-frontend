"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight2, Box, CloseCircle, MessageText1, Profile2User, TickCircle } from "iconsax-reactjs";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatRelative } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { toast } from "@/shared/ui/Toast";
import { getErrorMessage } from "@/shared/lib/api";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import type { UserRole } from "@/modules/auth/types";
import { useAssignReseller, useMarkNotificationRead, useRevendeurReply } from "../hooks/useNotifications";
import type { ResellerOption } from "../services/notifications.service";
import type { Notification } from "../types";
import { ResellerCombobox } from "./ResellerCombobox";
import { ResellerSheet } from "./ResellerSheet";

interface Props {
  notification: Notification;
  role: UserRole;
  resellers: ResellerOption[];
}

export function NotificationItem({ notification: n, role, resellers }: Props) {
  const [revendeurId, setRevendeurId] = useState("");
  const [done, setDone] = useState(false);
  const [sheet, setSheet] = useState(false);
  const assign = useAssignReseller();
  const reply = useRevendeurReply();
  const markRead = useMarkNotificationRead();
  const touch = useMediaQuery("(max-width: 1023px)");

  const canAssign = (role === "mukubwa" || role === "admin") && !n.isRead && ((n.kind === "order_placed" && !!n.orderId) || (n.kind === "support_request" && !!n.conversationId));
  const canReply = role === "revendeur" && n.kind === "order_assigned" && !n.isRead && !!n.orderId;
  const Icon = n.type === "order" ? Box : MessageText1;
  const discussion = n.kind === "support_request";

  const confirmAssign = () => {
    if (!revendeurId) return toast.error("Choisissez un revendeur");
    assign.mutate(
      { notification: n, revendeurId: Number(revendeurId) },
      {
        onSuccess: () => {
          setDone(true);
          setSheet(false);
          toast.success(discussion ? "Discussion assignée" : "Commande assignée", "Le revendeur a été notifié.");
        },
        onError: (e) => toast.error("Assignation impossible", getErrorMessage(e)),
      },
    );
  };

  return (
    <motion.li layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} className={cn("relative rounded-box border p-4 transition-colors sm:p-5", n.isRead ? "border-line-3 bg-white" : "border-primary/30 bg-primary-50")}>
      <div className="flex items-start gap-3 sm:gap-4">
        <span className={cn("relative grid size-11 shrink-0 place-items-center rounded-full", n.type === "order" ? "bg-primary-100 text-primary-dark" : "bg-info/10 text-info")}>
          <Icon size={22} variant="Bold" />
          {!n.isRead && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-danger ring-2 ring-white sm:hidden" aria-label="Non lue" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
            <h3 className="text-[15px] leading-[21px]">{n.title}</h3>
            {!n.isRead && <span className="hidden size-2 rounded-full bg-danger sm:block" aria-label="Non lue" />}
            <span className="text-[12px] text-ink-3 sm:ml-auto">{formatRelative(n.createdAt)}</span>
          </div>
          <p className="mt-1.5 text-[14px] leading-[21px] text-ink-2 sm:mt-1">{n.body}</p>

        </div>
      </div>

      {/* Actions : pleine largeur sur mobile (cibles 48 px), alignées sous le texte sur desktop */}
      <div className="mt-3.5 flex flex-col gap-2 sm:mt-3 sm:pl-[60px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={n.link || ROUTES.notifications}
            onClick={() => !n.isRead && markRead.mutate(n.id)}
            className="group inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-box bg-white text-[14px] font-bold text-primary ring-1 ring-primary/30 transition-all active:scale-[0.98] sm:min-h-0 sm:w-auto sm:bg-transparent sm:text-[13px] sm:ring-0"
          >
            {n.conversationId ? "Ouvrir la discussion" : "Voir la commande"} <ArrowRight2 size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
          {!n.isRead && !canAssign && !canReply && (
            <button onClick={() => markRead.mutate(n.id)} className="min-h-11 w-full rounded-box text-[13px] font-semibold text-ink-3 active:bg-chip sm:ml-3 sm:min-h-0 sm:w-auto sm:rounded-none sm:text-[12px] sm:hover:text-ink">
              Marquer comme lue
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {canAssign && !done && (
            <motion.div key="assign" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "visible" } }} exit={{ opacity: 0, height: 0, overflow: "hidden" }} className="overflow-hidden">
              {touch ? (
                <>
                  <Button fullWidth upper={false} leftIcon={<Profile2User size={18} variant="Bold" />} onClick={() => setSheet(true)}>
                    Assigner à un revendeur
                  </Button>
                  <ResellerSheet open={sheet} onClose={() => setSheet(false)} options={resellers} value={revendeurId} onChange={setRevendeurId} onConfirm={confirmAssign} loading={assign.isPending} />
                </>
              ) : (
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <ResellerCombobox options={resellers} value={revendeurId} onChange={setRevendeurId} className="sm:w-[340px]" />
                  <Button size="md" onClick={confirmAssign} loading={assign.isPending} upper={false}>Confirmer</Button>
                </div>
              )}
            </motion.div>
          )}
          {done && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-[13px] font-bold text-white sm:w-auto sm:justify-start sm:py-2">
              <motion.span initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 12 }}><TickCircle size={18} variant="Bold" /></motion.span>
              {discussion ? "Discussion assignée avec succès" : "Commande assignée avec succès"}
            </motion.div>
          )}
          {canReply && (
            <motion.div key="reply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button size="sm" leftIcon={<TickCircle size={16} variant="Bold" />} loading={reply.isPending} upper={false} onClick={() => reply.mutate({ notification: n, accept: true }, { onSuccess: () => toast.success("Commande acceptée"), onError: (e) => toast.error("Action impossible", getErrorMessage(e)) })}>Accepter</Button>
              <Button size="sm" variant="chip" leftIcon={<CloseCircle size={16} variant="Bold" />} upper={false} onClick={() => reply.mutate({ notification: n, accept: false }, { onSuccess: () => toast.info("Commande déclinée"), onError: (e) => toast.error("Action impossible", getErrorMessage(e)) })}>Décliner</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}
