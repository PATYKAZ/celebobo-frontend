"use client";

import { AnimatePresence, motion } from "motion/react";
import { CloseCircle } from "iconsax-reactjs";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

function useLockBodyScroll(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && document.dispatchEvent(new CustomEvent("overlay-escape"));
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = () => onClose();
    document.addEventListener("overlay-escape", h);
    return () => document.removeEventListener("overlay-escape", h);
  }, [open, onClose]);
}

/** Modale centrée. */
export function Modal({ open, onClose, title, children, className }: BaseProps) {
  useLockBodyScroll(open);
  useEscape(open, onClose);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className={cn("relative max-h-[92vh] w-full overflow-y-auto overscroll-contain rounded-b-none rounded-t-[22px] bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:max-h-[90vh] sm:max-w-[520px] sm:rounded-box sm:p-6", className)}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              {title && <h3 className="text-[20px] leading-[28px]">{title}</h3>}
              <button onClick={onClose} aria-label="Fermer" className="ml-auto text-ink-3 transition-colors hover:text-danger">
                <CloseCircle size={26} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Panneau latéral (menu mobile, filtres). */
export function Drawer({ open, onClose, title, children, className, side = "left" }: BaseProps & { side?: "left" | "right" }) {
  useLockBodyScroll(open);
  useEscape(open, onClose);
  if (typeof document === "undefined") return null;
  const x = side === "left" ? "-100%" : "100%";
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            initial={{ x }}
            animate={{ x: 0 }}
            exit={{ x }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            className={cn("absolute inset-y-0 flex w-full flex-col bg-white sm:w-[88%]", !className?.includes("max-w-") && "sm:max-w-[360px]", side === "left" ? "left-0" : "right-0", className)}
          >
            <div className="flex items-center justify-between border-b border-line-3 px-5 pb-4 pt-[max(16px,env(safe-area-inset-top))]">
              <h3 className="text-[18px]">{title}</h3>
              <button onClick={onClose} aria-label="Fermer" className="text-ink-3 hover:text-danger">
                <CloseCircle size={26} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
