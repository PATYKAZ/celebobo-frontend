"use client";

import { motion } from "motion/react";
import { Box, TickCircle, Timer1 } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import type { OrderStatus } from "../types";

const STEPS: { key: OrderStatus; label: string; icon: typeof Box }[] = [
  { key: "attente", label: "Reçue", icon: Timer1 },
  { key: "traitement", label: "En traitement", icon: Box },
  { key: "terminé", label: "Terminée", icon: TickCircle },
];

/** Frise de progression animée : attente → traitement → terminé. */
export function OrderTimeline({ status, className }: { status: OrderStatus; className?: string }) {
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className={cn("flex items-start", className)} aria-label="Progression de la commande">
      {STEPS.map((s, i) => {
        const done = i <= current;
        const Icon = s.icon;
        return (
          <li key={s.key} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span className="absolute right-1/2 top-[18px] h-[3px] w-full -translate-y-1/2 overflow-hidden rounded-full bg-line-3">
                <motion.span
                  className="block h-full origin-left bg-primary"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i <= current ? 1 : 0 }}
                  transition={{ duration: 0.6, delay: i * 0.25 }}
                />
              </span>
            )}
            <motion.span
              initial={{ scale: 0.6 }}
              animate={{ scale: i === current ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 0.5, delay: i * 0.25 }}
              className={cn("relative z-10 grid size-9 place-items-center rounded-full transition-colors", done ? "bg-primary text-white" : "bg-chip text-ink-3")}
            >
              <Icon size={18} variant={done ? "Bold" : "Linear"} />
              {i === current && status !== "terminé" && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />}
            </motion.span>
            <span className={cn("mt-2 text-[12px] font-semibold leading-[16px]", done ? "text-ink" : "text-ink-3")}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
