"use client";

import { motion } from "motion/react";
import { Stars } from "@/shared/ui/Stars";
import type { Review } from "../types";

/** Note moyenne + distribution 5→1 (barres animées). */
export function ReviewSummary({ reviews }: { reviews: Review[] }) {
  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  return (
    <div className="flex flex-col gap-6 rounded-box bg-page/60 p-5 sm:flex-row sm:items-center sm:gap-10">
      <div className="text-center">
        <p className="text-[48px] font-bold leading-none">{avg.toFixed(1)}</p>
        <Stars rating={avg} size={16} hideCount className="mt-2 justify-center" />
        <p className="mt-1 text-[12px] text-ink-2">{total} avis</p>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = reviews.filter((r) => r.rating === n).length;
          const pct = total ? (count / total) * 100 : 0;
          return (
            <li key={n} className="flex items-center gap-3 text-[12px]">
              <span className="w-8 shrink-0 font-semibold">{n} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                <motion.span initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="block h-full rounded-full bg-star" />
              </span>
              <span className="w-6 text-right text-ink-2">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
