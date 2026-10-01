"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: DonutSegment[];
  size?: number;
  /** Libellé sous le total central */
  centerLabel?: string;
  format?: (n: number) => string;
  title: string;
  /** Légende à droite (≥ sm) plutôt qu'en dessous */
  legendSide?: boolean;
}

/** Anneau animé : segments qui se dessinent, survol = zoom + valeur au centre, légende avec %. */
export function DonutChart({ segments, size = 190, centerLabel = "Total", format = (n) => String(Math.round(n)), title, legendSide = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const gap = segments.length > 1 ? 0.8 : 0;
  let acc = 0;
  const shown = active != null ? segments[active] : null;

  return (
    <div ref={ref} className={cn("flex flex-col items-center gap-6", legendSide && "sm:flex-row sm:justify-center")}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={title} className="-rotate-90">
          <title>{title}</title>
          <circle cx={c} cy={c} r={r} fill="none" stroke="#EBEEF6" strokeWidth={stroke} />
          {segments.map((s, i) => {
            const len = (s.value / total) * 100;
            const start = acc;
            acc += len;
            return (
              <motion.circle
                key={s.label}
                cx={c}
                cy={c}
                r={r}
                pathLength={100}
                fill="none"
                stroke={s.color}
                strokeWidth={active === i ? stroke + 6 : stroke}
                strokeDashoffset={-start}
                opacity={active == null || active === i ? 1 : 0.35}
                initial={{ strokeDasharray: "0 100" }}
                animate={inView ? { strokeDasharray: `${Math.max(0, len - gap)} ${100 - Math.max(0, len - gap)}` } : {}}
                transition={{ duration: 0.9, delay: i * 0.12, ease: "easeOut" }}
                style={{ transition: "stroke-width .2s, opacity .2s", cursor: "pointer" }}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="max-w-[110px] truncate text-[22px] font-bold leading-[26px]">{format(shown ? shown.value : total)}</p>
            <p className="max-w-[110px] truncate text-[12px] text-ink-3">{shown ? shown.label : centerLabel}</p>
          </div>
        </div>
      </div>
      <ul className="grid w-full max-w-[280px] gap-2.5">
        {segments.map((s, i) => (
          <li key={s.label} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} className={cn("flex cursor-default items-center gap-2.5 rounded-md px-2 py-1 text-[13px] transition-colors", active === i && "bg-chip")}>
            <span className="size-3 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            <span className="font-bold">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
