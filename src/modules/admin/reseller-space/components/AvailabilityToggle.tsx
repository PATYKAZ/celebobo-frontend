"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/ui/Toast";
import type { Availability } from "@/modules/messaging/types";
import { useAvailability } from "../hooks/useResellerSpace";

const OPTIONS: { value: Availability; label: string; dot: string }[] = [
  { value: "online", label: "En ligne", dot: "bg-primary" },
  { value: "away", label: "Absent", dot: "bg-star" },
  { value: "offline", label: "Hors ligne", dot: "bg-ink-3" },
];

/** Statut de disponibilité du revendeur — visible des responsables au moment d'assigner, et des clients dans la discussion. */
export function AvailabilityToggle({ value }: { value: Availability }) {
  const id = useId();
  const set = useAvailability();
  return (
    <div role="radiogroup" aria-label="Ma disponibilité" className="inline-flex gap-1 rounded-full bg-chip p-1">
      {OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            disabled={set.isPending}
            onClick={() => !active && set.mutate(o.value, { onSuccess: () => toast.success(`Vous êtes « ${o.label.toLowerCase()} »`, o.value === "online" ? "Les nouvelles commandes peuvent vous être assignées." : "Les responsables le voient avant d'assigner.") })}
            className={cn("relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors", active ? "text-ink" : "text-ink-2 hover:text-ink")}
          >
            {active && <motion.span layoutId={`avail-${id}`} className="absolute inset-0 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,.12)]" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
            <span className="relative flex items-center gap-2">
              <span className={cn("size-2 rounded-full", o.dot, active && o.value === "online" && "animate-pulse")} />
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
