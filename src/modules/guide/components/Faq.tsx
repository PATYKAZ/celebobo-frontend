"use client";

import { AnimatePresence, motion } from "motion/react";
import { Add } from "iconsax-reactjs";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { FAQ } from "../mocks/content";

/** Accordéon à hauteur animée (une seule réponse ouverte). */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line-3">
      {FAQ.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 py-5 text-left">
              <span className={cn("text-[16px] font-bold leading-[24px] transition-colors", isOpen && "text-primary")}>{f.q}</span>
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full transition-all duration-300", isOpen ? "rotate-45 bg-primary text-white" : "bg-chip")}><Add size={18} /></span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                  <p className="pb-5 pr-12 text-[14px] leading-[24px] text-ink-2">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
