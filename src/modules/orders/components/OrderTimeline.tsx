"use client";

import { motion } from "motion/react";
import { BoxTick, CloseCircle, Refresh2, TickCircle, Timer1, TruckFast, UserTick, Wallet3, type Icon } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format";
import { ORDER_FLOW, ORDER_STATUS_LABEL, type Order, type OrderStatus, type OrderStatusEvent } from "../types";

const ICONS: Record<OrderStatus, Icon> = {
  attente: Timer1,
  assignee: UserTick,
  confirmee: BoxTick,
  payee: Wallet3,
  en_livraison: TruckFast,
  livree: TickCircle,
  annulee: CloseCircle,
  retournee: Refresh2,
};

type TimelineOrder = Pick<Order, "status" | "statusHistory">;

/** Étapes affichées : le flux normal, + l'étape finale « annulée / retournée » si c'est le cas. */
function buildSteps(order: TimelineOrder) {
  const reached = new Map<OrderStatus, OrderStatusEvent>();
  for (const e of order.statusHistory) reached.set(e.status, e);
  const flow: OrderStatus[] = [...ORDER_FLOW];
  // Commande annulée : on ne montre que les étapes réellement atteintes + l'annulation
  const steps: OrderStatus[] =
    order.status === "annulee" ? [...flow.filter((s) => reached.has(s)), "annulee"] : order.status === "retournee" ? [...flow, "retournee"] : flow;
  const currentIndex = steps.indexOf(order.status);
  return steps.map((status, i) => ({ status, event: reached.get(status), done: reached.has(status) || i <= currentIndex, current: i === currentIndex }));
}

const tone = (s: OrderStatus, done: boolean) => (!done ? "bg-chip text-ink-3" : s === "annulee" ? "bg-danger text-white" : s === "retournee" ? "bg-ink-3 text-white" : "bg-primary text-white");

/**
 * Frise de progression animée.
 *  - horizontal : bandeau d'étapes (page détail, grand écran)
 *  - vertical   : liste datée « qui / quand » (historique)
 */
export function OrderTimeline({ order, layout = "horizontal", className }: { order: TimelineOrder; layout?: "horizontal" | "vertical"; className?: string }) {
  const steps = buildSteps(order);

  if (layout === "vertical") {
    return (
      <ol className={cn("relative space-y-5", className)} aria-label="Historique de la commande">
        <span aria-hidden className="absolute bottom-3 left-[17px] top-3 w-[2px] bg-line-3" />
        {steps.map((s, i) => {
          const Icon = ICONS[s.status];
          return (
            <motion.li key={s.status} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative flex gap-4">
              <span className={cn("relative z-10 grid size-9 shrink-0 place-items-center rounded-full transition-colors", tone(s.status, s.done))}>
                <Icon size={18} variant={s.done ? "Bold" : "Linear"} />
                {s.current && s.status !== "livree" && s.status !== "annulee" && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={cn("text-[14px] font-bold leading-[18px]", !s.done && "text-ink-3")}>{ORDER_STATUS_LABEL[s.status]}</p>
                {s.event ? (
                  <p className="mt-0.5 text-[12px] leading-[17px] text-ink-2">
                    {formatDateTime(s.event.at)}
                    {s.event.by.name ? ` · par ${s.event.by.name}` : ""}
                    {s.event.note ? <span className="block italic text-ink-3">« {s.event.note} »</span> : null}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[12px] text-ink-3">À venir</p>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
    );
  }

  const currentIdx = steps.findIndex((s) => s.current);
  return (
    <ol className={cn("flex items-start", className)} aria-label="Progression de la commande">
      {steps.map((s, i) => {
        const Icon = ICONS[s.status];
        return (
          <li key={s.status} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span className="absolute right-1/2 top-[18px] h-[3px] w-full -translate-y-1/2 overflow-hidden rounded-full bg-line-3">
                <motion.span
                  className={cn("block h-full origin-left", s.status === "annulee" ? "bg-danger" : "bg-primary")}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i <= currentIdx ? 1 : 0 }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                />
              </span>
            )}
            <motion.span
              initial={{ scale: 0.6 }}
              animate={{ scale: s.current ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={cn("relative z-10 grid size-9 place-items-center rounded-full transition-colors", tone(s.status, s.done))}
            >
              <Icon size={18} variant={s.done ? "Bold" : "Linear"} />
              {s.current && s.status !== "livree" && s.status !== "annulee" && s.status !== "retournee" && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />}
            </motion.span>
            <span className={cn("mt-2 px-0.5 text-[11px] font-semibold leading-[14px] sm:text-[12px] sm:leading-[16px]", s.done ? "text-ink" : "text-ink-3")}>{ORDER_STATUS_LABEL[s.status]}</span>
            {s.event && <span className="mt-0.5 hidden text-[10px] text-ink-3 md:block">{formatDateTime(s.event.at).split(" à ")[0]}</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** Mini-progression (carte de liste) : barre + « Étape n/6 ». */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const idx = ORDER_FLOW.indexOf(status);
  const final = idx < 0;
  const pct = final ? 100 : ((idx + 1) / ORDER_FLOW.length) * 100;
  const bad = status === "annulee";
  return (
    <div aria-label={`Statut : ${ORDER_STATUS_LABEL[status]}`}>
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="font-semibold">{ORDER_STATUS_LABEL[status]}</span>
        {!final && <span className="text-ink-3">Étape {idx + 1}/{ORDER_FLOW.length}</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line-3">
        <motion.div className={cn("h-full rounded-full", bad ? "bg-danger" : status === "retournee" ? "bg-ink-3" : "bg-primary")} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  );
}

