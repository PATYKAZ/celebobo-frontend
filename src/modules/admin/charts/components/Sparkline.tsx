"use client";

import { motion } from "motion/react";
import { useId } from "react";

/** Mini courbe sans axes (cartes KPI, lignes de tableau). */
export function Sparkline({ data, color = "#1ABA1A", width = 96, height = 32, title = "Tendance" }: { data: number[]; color?: string; width?: number; height?: number; title?: string }) {
  const gid = useId().replace(/:/g, "");
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - 3 - ((v - min) / span) * (height - 6)]);
  const line = `M${pts.map((p) => p.join(",")).join(" L")}`;
  return (
    <svg width={width} height={height} role="img" aria-label={title} className="overflow-visible">
      <title>{title}</title>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${gid})`} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1 }} />
    </svg>
  );
}
