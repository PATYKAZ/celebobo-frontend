import { cn } from "@/shared/lib/cn";
import type { ResellerAvailability as Availability } from "../types";

const MAP: Record<Availability, { cls: string; label: string }> = {
  online: { cls: "bg-primary", label: "En ligne" },
  away: { cls: "bg-star", label: "Absent" },
  offline: { cls: "bg-ink-3", label: "Hors ligne" },
};

/** Pastille de disponibilité d'un revendeur. */
export function AvailabilityDot({ value, withLabel, className }: { value?: Availability; withLabel?: boolean; className?: string }) {
  if (!value) return null;
  const m = MAP[value];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] text-ink-2", className)} title={m.label}>
      <span className="relative inline-flex size-2.5">
        {value === "online" && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/50" />}
        <span className={cn("relative size-2.5 rounded-full", m.cls)} />
      </span>
      {withLabel && m.label}
    </span>
  );
}
