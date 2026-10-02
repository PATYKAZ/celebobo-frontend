"use client";

import { motion } from "motion/react";
import { TickCircle } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format";
import { ORDER_FLOW, ORDER_STATUS_LABEL, type Order } from "@/modules/orders/types";

/** Frise des 6 étapes (+ bandeau si annulée / retournée). */
export function StatusStepper({ order }: { order: Order }) {
  const terminal = order.status === "annulee" || order.status === "retournee";
  const reached = terminal ? Math.max(0, ...order.statusHistory.map((h) => ORDER_FLOW.indexOf(h.status))) : ORDER_FLOW.indexOf(order.status);
  return (
    <div>
      <ol className="flex items-start">
        {ORDER_FLOW.map((s, i) => {
          const done = i <= reached;
          const current = !terminal && i === reached;
          return (
            <li key={s} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && (
                <span className="absolute right-1/2 top-[15px] h-[3px] w-full rounded bg-chip">
                  <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: done ? 1 : 0 }} transition={{ duration: 0.5, delay: i * 0.08 }} className={cn("block h-full origin-left rounded", terminal ? "bg-ink-3" : "bg-primary")} />
                </span>
              )}
              <motion.span
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: i * 0.06 }}
                className={cn("relative z-10 grid size-8 place-items-center rounded-full text-[12px] font-bold", done ? (terminal ? "bg-ink-3 text-white" : "bg-primary text-white") : "bg-chip text-ink-3", current && "ring-4 ring-primary/25")}
              >
                {done ? <TickCircle size={18} variant="Bold" /> : i + 1}
              </motion.span>
              <span className={cn("mt-2 hidden px-1 text-[12px] leading-[16px] sm:block", done ? "font-semibold" : "text-ink-3")}>{ORDER_STATUS_LABEL[s]}</span>
            </li>
          );
        })}
      </ol>
      {/* mobile : libellé de l'étape courante (les libellés de la frise sont masqués) */}
      {!terminal && (
        <p className="mt-3 text-center text-[13px] sm:hidden">
          Étape {Math.max(reached, 0) + 1}/{ORDER_FLOW.length} · <strong className="text-primary-dark">{ORDER_STATUS_LABEL[ORDER_FLOW[Math.max(reached, 0)]]}</strong>
        </p>
      )}
      {terminal && (
        <p className={cn("mt-4 rounded-box px-4 py-3 text-[13px] font-semibold", order.status === "annulee" ? "bg-danger-100 text-danger" : "bg-chip text-ink-2")}>
          {ORDER_STATUS_LABEL[order.status]}
          {order.cancelReason ? ` — ${order.cancelReason}` : ""}
        </p>
      )}
    </div>
  );
}

/** Historique des statuts : qui, quand, note. */
export function StatusHistory({ order }: { order: Order }) {
  const items = [...order.statusHistory].reverse();
  return (
    <ol className="relative space-y-5 border-l-2 border-line-3 pl-5">
      {items.map((h, i) => (
        <motion.li key={`${h.status}-${h.at}-${i}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
          <span className={cn("absolute -left-[27px] top-1 size-3 rounded-full ring-4 ring-white", i === 0 ? "bg-primary" : "bg-line")} />
          <p className="text-[14px] font-semibold leading-[20px]">{ORDER_STATUS_LABEL[h.status]}</p>
          <p className="text-[12px] text-ink-3">
            {formatDateTime(h.at)} · par {h.by.name}
            {h.by.role !== "system" && <span className="capitalize"> ({h.by.role === "mukubwa" ? "responsable" : h.by.role})</span>}
          </p>
          {h.note && <p className="mt-1 rounded-md bg-page/60 px-3 py-1.5 text-[13px] text-ink-2">{h.note}</p>}
        </motion.li>
      ))}
    </ol>
  );
}
