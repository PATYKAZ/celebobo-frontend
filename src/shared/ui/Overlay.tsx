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
        <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={cn("relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-box bg-white p-6", className)}
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
            className={cn("absolute inset-y-0 flex w-[88%] max-w-[360px] flex-col bg-white", side === "left" ? "left-0" : "right-0", className)}
          >
            <div className="flex items-center justify-between border-b border-line-3 px-5 py-4">
              <h3 className="text-[18px]">{title}</h3>
              <button onClick={onClose} aria-label="Fermer" className="text-ink-3 hover:text-danger">
                <CloseCircle size={26} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
