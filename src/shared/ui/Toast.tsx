"use client";

import { AnimatePresence, motion } from "motion/react";
import { CloseCircle, InfoCircle, TickCircle } from "iconsax-reactjs";
import { create } from "zustand";
import { cn } from "@/shared/lib/cn";

type Kind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: Kind;
  title: string;
  description?: string;
}

const useToastStore = create<{ items: ToastItem[]; push: (t: Omit<ToastItem, "id">) => void; dismiss: (id: number) => void }>((set) => ({
  items: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items.slice(-3), { ...t, id }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 3800);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

/** API impérative : toast.success("Titre", "description") — utilisable partout. */
export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ kind: "success", title, description }),
  error: (title: string, description?: string) => useToastStore.getState().push({ kind: "error", title, description }),
  info: (title: string, description?: string) => useToastStore.getState().push({ kind: "info", title, description }),
};

const ICON = {
  success: <TickCircle size={22} variant="Bold" className="text-primary" />,
  error: <CloseCircle size={22} variant="Bold" className="text-danger" />,
  info: <InfoCircle size={22} variant="Bold" className="text-info" />,
};

/** À monter une fois (providers). */
export function Toaster() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-5 sm:top-5 sm:items-end">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={cn("pointer-events-auto flex w-full max-w-[360px] items-start gap-3 rounded-box border-l-4 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.12)]", t.kind === "success" ? "border-primary" : t.kind === "error" ? "border-danger" : "border-info")}
          >
            {ICON[t.kind]}
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-[20px]">{t.title}</p>
              {t.description && <p className="mt-0.5 line-clamp-2 text-[13px] leading-[18px] text-ink-2">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Fermer" className="text-ink-3 hover:text-ink">
              <span className="text-lg leading-none">×</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
