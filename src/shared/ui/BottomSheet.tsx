"use client";

import { AnimatePresence, motion, useDragControls } from "motion/react";
import { CloseCircle } from "iconsax-reactjs";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Action à droite du titre (ex: « Personnaliser ») */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Hauteur max (vh) */
  maxVh?: number;
}

/**
 * Feuille modale ancrée en bas (mobile) — poignée, glisser vers le bas pour fermer, zone sûre iOS.
 * Sur grand écran elle devient une modale centrée.
 */
export function BottomSheet({ open, onClose, title, action, children, className, maxVh = 86 }: Props) {
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => (info.offset.y > 90 || info.velocity.y > 600) && onClose()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            style={{ maxHeight: `${maxVh}vh` }}
            className={cn("relative flex w-full flex-col rounded-t-[22px] bg-white sm:max-w-[560px] sm:rounded-box", className)}
          >
            {/* poignée : zone de glissement */}
            <div onPointerDown={(e) => controls.start(e)} className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-2.5 active:cursor-grabbing sm:hidden">
              <span className="h-1.5 w-11 rounded-full bg-line" />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3 sm:pt-5">
              <h3 className="text-[16px] font-bold leading-[22px]">{title}</h3>
              <div className="flex items-center gap-3">
                {action}
                <button onClick={onClose} aria-label="Fermer" className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:text-danger active:scale-90">
                  <CloseCircle size={26} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-safe">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
