"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown2 } from "@/shared/ui/icons";
import { useState } from "react";

/** Colonne de liens du footer : accordéon sur mobile (< lg), liste ouverte sur desktop. */
export function FooterColumn({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  const [open, setOpen] = useState(false);
  const list = (
    <ul className="pb-1 lg:mt-4 lg:space-y-2 lg:pb-0">
      {links.map(([label, href]) => (
        <li key={label}>
          <Link href={href} className="link-underline flex min-h-11 items-center text-sm text-ink-2 transition-colors hover:text-primary lg:block lg:min-h-0">{label}</Link>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="border-b border-line-3 lg:border-0">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-4 text-left lg:pointer-events-none lg:py-0">
        <h2 className="text-sm font-bold lg:text-base">{title}</h2>
        <ArrowDown2 size={16} className={`transition-transform lg:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      {/* mobile : animé ; desktop : toujours visible */}
      <div className="lg:hidden">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              {list}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="hidden lg:block">{list}</div>
    </div>
  );
}
