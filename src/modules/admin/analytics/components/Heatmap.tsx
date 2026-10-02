"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Carte de chaleur jours × heures : cellules qui apparaissent en vague, infobulle au survol. */
export function Heatmap({ data, hours }: { data: number[][]; hours: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(1, ...data.flat());

  return (
    <div ref={ref} className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="min-w-[520px]">
        <div className="mb-1.5 grid gap-1 pl-10" style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0,1fr))` }}>
          {hours.map((h) => <span key={h} className="text-center text-[11px] text-ink-3">{h}h</span>)}
        </div>
        {data.map((row, d) => (
          <div key={DAYS[d]} className="mb-1 flex items-center gap-1">
            <span className="sticky left-0 z-10 w-9 shrink-0 bg-white text-[12px] text-ink-3">{DAYS[d]}</span>
            <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0,1fr))` }}>
              {row.map((v, i) => (
                <motion.div
                  key={i}
                  title={`${DAYS[d]} ${hours[i]}h — ${v} vente${v > 1 ? "s" : ""}`}
                  onPointerEnter={() => setHover({ d, h: i })}
                  onPointerDown={() => setHover({ d, h: i })}
                  onPointerLeave={() => setHover(null)}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: (d + i) * 0.025, type: "spring", stiffness: 300, damping: 20 }}
                  className="aspect-square min-h-[24px] rounded-[5px] transition-transform hover:z-10 hover:scale-125"
                  style={{ background: v === 0 ? "#EBEEF6" : `rgba(26,186,26,${0.15 + (v / max) * 0.85})` }}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-3 flex items-center justify-between text-[12px] text-ink-3">
          <span aria-live="polite">{hover ? `${DAYS[hover.d]} ${hours[hover.h]}h : ${data[hover.d][hover.h]} vente(s)` : "Touchez une case pour voir le détail"}</span>
          <span className="flex items-center gap-1.5">Moins
            {[0.15, 0.4, 0.65, 1].map((o) => <span key={o} className="size-3.5 rounded-[4px]" style={{ background: `rgba(26,186,26,${o})` }} />)}
            Plus
          </span>
        </div>
      </div>
    </div>
  );
}
