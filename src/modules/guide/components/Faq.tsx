"use client";

import { AnimatePresence, motion } from "motion/react";
import { Add } from "iconsax-reactjs";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useFaq } from "@/modules/pages";

/** Accordéon à hauteur animée (une seule réponse ouverte), alimenté par `GET /faq/`. */
export function Faq() {
  const { data: groups, isLoading } = useFaq();
  const [open, setOpen] = useState<number | null>(null);

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12 !rounded-box" />)}</div>;
  if (!groups?.length) return <p className="py-4 text-[14px] text-ink-3">Aucune question pour le moment.</p>;

  const first = groups[0].entries[0]?.id ?? null;
  const current = open === null ? first : open;
  return (
    <div className="space-y-5 sm:space-y-6">
      {groups.map((g) => (
        <section key={g.category}>
          {groups.length > 1 && <h3 className="text-[12px] font-bold uppercase tracking-wider text-primary">{g.category}</h3>}
          <div className="divide-y divide-line-3">
            {g.entries.map((f) => {
              const isOpen = current === f.id;
              return (
                <div key={f.id}>
                  <button onClick={() => setOpen(isOpen ? -1 : f.id)} aria-expanded={isOpen} className="flex min-h-14 w-full items-center justify-between gap-4 py-3.5 text-left active:bg-chip sm:py-5">
                    <span className={cn("text-[15px] font-bold leading-[22px] transition-colors sm:text-[16px] sm:leading-[24px]", isOpen && "text-primary")}>{f.question}</span>
                    <span className={cn("grid size-9 shrink-0 sm:size-8 place-items-center rounded-full transition-all duration-300", isOpen ? "rotate-45 bg-primary text-white" : "bg-chip")}><Add size={18} /></span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                        <p className="whitespace-pre-line pb-4 pr-2 text-[14px] leading-[23px] text-ink-2 sm:pb-5 sm:pr-12 sm:leading-[24px]">{f.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
