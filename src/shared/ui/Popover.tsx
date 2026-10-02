"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/lib/cn";
import { BottomSheet } from "./BottomSheet";

interface Props {
  /** Contenu du déclencheur. */
  trigger: ReactNode;
  /** Contenu : peut être une fonction recevant `close`. */
  children: ReactNode | ((close: () => void) => ReactNode);
  openOn?: "hover" | "click";
  align?: "left" | "right" | "center";
  className?: string;
  panelClassName?: string;
  triggerClassName?: string;
  label?: string;
  /**
   * Sur mobile (< sm) le panneau s'ouvre en feuille (BottomSheet) — plus confortable au doigt.
   * Actif par défaut pour les popovers « clic » ; ignoré pour `openOn="hover"`. Desktop inchangé.
   */
  sheetOnMobile?: boolean;
  /** Titre de la feuille mobile (défaut : `label`) */
  sheetTitle?: string;
}

/** Menu déroulant animé (hover desktop ou clic). Se ferme au clic extérieur / Échap. */
export function Popover({ trigger, children, openOn = "click", align = "left", className, panelClassName, triggerClassName, label, sheetOnMobile, sheetTitle }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const asSheet = (sheetOnMobile ?? openOn === "click") && isMobile;

  useEffect(() => {
    if (!open || asSheet) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, asSheet]);

  const close = () => setOpen(false);
  const hover = openOn === "hover";
  const content = typeof children === "function" ? children(close) : children;

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      onMouseEnter={hover ? () => { clearTimeout(timer.current); setOpen(true); } : undefined}
      onMouseLeave={hover ? () => { timer.current = setTimeout(() => setOpen(false), 120); } : undefined}
    >
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)} className={triggerClassName}>
        {trigger}
      </button>
      {asSheet ? (
        <BottomSheet open={open} onClose={close} title={sheetTitle ?? label ?? ""}>
          <div className="pb-2 pt-1">{content}</div>
        </BottomSheet>
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "absolute top-full z-50 mt-2 min-w-[200px] rounded-box border border-line-3 bg-white p-2 shadow-[0_12px_40px_rgba(0,0,0,.12)]",
                align === "left" && "left-0",
                align === "right" && "right-0",
                align === "center" && "left-1/2 -translate-x-1/2",
                panelClassName,
              )}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
