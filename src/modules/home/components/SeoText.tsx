"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowDown2 } from "iconsax-reactjs";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";

export function SeoText({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal>
      <Block pad="none" className="px-4 py-5 sm:px-[30px] sm:py-[30px]">
        <h2 className="text-[16px] leading-[21.6px] sm:text-section">{title}</h2>
        <motion.div initial={false} animate={{ height: open ? "auto" : 112 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative mt-4 overflow-hidden">
          <div className="space-y-4 text-body-lg text-ink-2">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white to-transparent" />}
        </motion.div>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-2 inline-flex h-11 items-center gap-1 text-link font-semibold text-primary transition-colors hover:text-primary-dark sm:mt-3 sm:h-auto sm:font-normal sm:text-ink">
          {open ? "Voir moins" : "Voir tout"}
          <ArrowDown2 size={13} variant="Bold" className={open ? "rotate-180 transition-transform" : "transition-transform"} />
        </button>
      </Block>
    </Reveal>
  );
}
