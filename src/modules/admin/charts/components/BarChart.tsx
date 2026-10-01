"use client";

import Image from "next/image";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { useChartWidth } from "../hooks/useChartWidth";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  image?: string | null;
  /** Valeur de la ligne superposée (vertical uniquement) */
  line?: number;
}

interface Props {
  data: BarDatum[];
  orientation?: "vertical" | "horizontal";
  height?: number;
  color?: string;
  lineColor?: string;
  format?: (n: number) => string;
  title: string;
  lineLabel?: string;
}

const PAD = { t: 22, r: 12, b: 28, l: 48 };

function niceMax(v: number) {
  if (v <= 0) return 10;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function BarChart({ data, orientation = "vertical", height = 280, color = "#1ABA1A", lineColor = "#222222", format = (n) => String(Math.round(n)), title, lineLabel }: Props) {
  if (orientation === "horizontal") return <HBars data={data} color={color} format={format} title={title} />;
  return <VBars data={data} height={height} color={color} lineColor={lineColor} format={format} title={title} lineLabel={lineLabel} />;
}

function VBars({ data, height, color, lineColor, format, title, lineLabel }: Required<Pick<Props, "data" | "height" | "color" | "lineColor" | "format" | "title">> & { lineLabel?: string }) {
  const { ref, width } = useChartWidth();
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.map((d) => Math.max(d.value, d.line ?? 0))));
  const w = width - PAD.l - PAD.r;
  const h = height - PAD.t - PAD.b;
  const slot = w / Math.max(1, data.length);
  const bw = Math.min(40, slot * 0.58);
  const y = (v: number) => PAD.t + h - (v / max) * h;
  const hasLine = data.some((d) => d.line != null);
  const linePts = data.map((d, i) => [PAD.l + slot * i + slot / 2, y(d.line ?? 0)] as const);

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label={title} className="overflow-visible">
        <title>{title}</title>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={width - PAD.r} y1={y(t * max)} y2={y(t * max)} stroke="#DEE2E6" strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text x={PAD.l - 8} y={y(t * max) + 4} textAnchor="end" fontSize="11" fill="#999">{format(t * max)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.l + slot * i + slot / 2;
          const bh = h - (y(d.value) - PAD.t);
          return (
            <g key={d.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <rect x={cx - slot / 2} y={PAD.t} width={slot} height={h} fill="transparent" />
              <motion.rect
                x={cx - bw / 2}
                width={bw}
                rx={6}
                fill={d.color ?? color}
                opacity={hover == null || hover === i ? 1 : 0.45}
                initial={{ y: PAD.t + h, height: 0 }}
                animate={inView ? { y: y(d.value), height: bh } : {}}
                transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
              <text x={cx} y={height - 8} textAnchor="middle" fontSize="11" fill="#999">{d.label}</text>
            </g>
          );
        })}
        {hasLine && (
          <g pointerEvents="none">
            <motion.path d={`M${linePts.map((p) => p.join(",")).join(" L")}`} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.2, delay: 0.6 }} />
            {linePts.map((p, i) => <motion.circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill="#fff" stroke={lineColor} strokeWidth={2} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.9 + i * 0.04 }} />)}
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-box border border-line-3 bg-white px-3 py-2 text-[12px] shadow-[0_8px_30px_rgba(0,0,0,.12)]" style={{ left: Math.min(Math.max(PAD.l + slot * hover + slot / 2, 70), width - 70) }}>
          <p className="font-bold">{data[hover].label}</p>
          <p className="text-ink-2">{format(data[hover].value)}</p>
          {data[hover].line != null && <p className="text-ink-2">{lineLabel ?? "Ligne"} : {format(data[hover].line as number)}</p>}
        </div>
      )}
    </div>
  );
}

function HBars({ data, color, format, title }: Required<Pick<Props, "data" | "color" | "format" | "title">>) {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul ref={ref} aria-label={title} className="flex flex-col gap-3.5">
      {data.map((d, i) => (
        <li key={d.label} className="group flex items-center gap-3">
          <span className="w-5 shrink-0 text-center text-[13px] font-bold text-ink-3">{i + 1}</span>
          {d.image !== undefined && (
            <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-page">
              {d.image && <Image src={d.image} alt="" fill sizes="44px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-[13px] font-semibold leading-[18px]">{d.label}</span>
              <span className="shrink-0 text-[13px] font-bold">{format(d.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-chip">
              <motion.div className={cn("h-full rounded-full")} style={{ background: d.color ?? color }} initial={{ width: 0 }} animate={inView ? { width: `${(d.value / max) * 100}%` } : {}} transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
