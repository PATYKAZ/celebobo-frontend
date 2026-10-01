"use client";

import { motion, useInView } from "motion/react";
import { useId, useRef, useState, type PointerEvent } from "react";
import { useChartWidth } from "../hooks/useChartWidth";

export interface AreaSeries {
  key: string;
  label: string;
  color: string;
  data: number[];
  /** Remplissage dégradé sous la courbe */
  area?: boolean;
}

interface Props {
  labels: string[];
  series: AreaSeries[];
  height?: number;
  format?: (n: number) => string;
  title: string;
}

const PAD = { t: 14, r: 14, b: 28, l: 52 };

function niceMax(v: number) {
  if (v <= 0) return 10;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** Courbe lissée (Catmull-Rom → Bézier). */
function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Graphique en aires/lignes multi-séries, trait animé, croix + infobulle au survol. */
export function AreaLineChart({ labels, series, height = 280, format = (n) => String(Math.round(n)), title }: Props) {
  const { ref, width } = useChartWidth();
  const gid = useId().replace(/:/g, "");
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const n = labels.length;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.data)));
  const w = width - PAD.l - PAD.r;
  const h = height - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => PAD.t + h - (v / max) * h;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 64))));

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const px = e.clientX - r.left - PAD.l;
    setHover(Math.max(0, Math.min(n - 1, Math.round((px / w) * (n - 1)))));
  };

  const tipLeft = hover != null ? Math.min(Math.max(x(hover), 90), width - 90) : 0;

  return (
    <div ref={ref} className="relative w-full select-none">
      <svg ref={svgRef} width={width} height={height} role="img" aria-label={title} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="touch-pan-y overflow-visible">
        <title>{title}</title>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${gid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} stroke="#DEE2E6" strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#999">{format(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => (i % step === 0 ? <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="#999">{l}</text> : null))}

        {series.map((s, si) => {
          const pts = s.data.map((v, i) => [x(i), y(v)] as [number, number]);
          const line = smooth(pts);
          const area = `${line} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`;
          return (
            <g key={s.key}>
              {s.area !== false && <motion.path d={area} fill={`url(#${gid}-${s.key})`} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.9, delay: 0.5 + si * 0.15 }} />}
              <motion.path d={line} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.3, delay: si * 0.15, ease: "easeOut" }} />
            </g>
          );
        })}

        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} stroke="#999" strokeOpacity={0.5} strokeDasharray="4 4" />
            {series.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(s.data[hover])} r={5} fill="#fff" stroke={s.color} strokeWidth={3} />
            ))}
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-2 z-10 min-w-[150px] -translate-x-1/2 rounded-box border border-line-3 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,.12)]" style={{ left: tipLeft }}>
          <p className="mb-1.5 text-[12px] font-bold">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center justify-between gap-4 text-[12px] leading-[18px]">
              <span className="flex items-center gap-1.5 text-ink-2"><span className="size-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
              <strong>{format(s.data[hover])}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
