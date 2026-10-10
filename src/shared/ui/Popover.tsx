"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/lib/cn";
import { BottomSheet } from "./BottomSheet";
import { PopoverContent, Popover as PopoverRoot, PopoverTrigger } from "./shadcn/popover";

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

const ALIGN = { left: "start", right: "end", center: "center" } as const;

/**
 * Panneau déroulant (Radix Popover) : clic, ou survol desktop (menus de navigation).
 * Se ferme au clic extérieur / Échap et rend alors le focus au déclencheur. Au clavier, le focus entre
 * dans le panneau ; à la souris en mode survol, il reste sur la page.
 */
export function Popover({ trigger, children, openOn = "click", align = "left", className, panelClassName, triggerClassName, label, sheetOnMobile, sheetTitle }: Props) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const byPointer = useRef(false);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const hover = openOn === "hover";
  const asSheet = (sheetOnMobile ?? !hover) && isMobile;

  useEffect(() => () => clearTimeout(timer.current), []);

  const close = () => setOpen(false);
  const content = typeof children === "function" ? children(close) : children;
  const enter = hover
    ? () => {
        clearTimeout(timer.current);
        if (!open) byPointer.current = true;
        setOpen(true);
      }
    : undefined;
  const leave = hover ? () => (timer.current = setTimeout(() => setOpen(false), 120)) : undefined;

  if (asSheet) {
    return (
      <div className={cn("relative", className)}>
        <button type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)} className={triggerClassName}>
          {trigger}
        </button>
        <BottomSheet open={open} onClose={close} title={sheetTitle ?? label ?? ""}>
          <div className="pb-2 pt-1">{content}</div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <PopoverRoot
      open={open}
      onOpenChange={(o) => {
        if (o) byPointer.current = false;
        setOpen(o);
      }}
    >
      <div className={cn("relative", className)} onMouseEnter={enter} onMouseLeave={leave}>
        <PopoverTrigger
          aria-label={label}
          className={triggerClassName}
          // ouvert par le survol : un clic ne doit pas le refermer sous le curseur
          onClick={(e) => hover && open && byPointer.current && e.preventDefault()}
        >
          {trigger}
        </PopoverTrigger>
      </div>
      <PopoverContent
        align={ALIGN[align]}
        className={panelClassName}
        onMouseEnter={enter}
        onMouseLeave={leave}
        onOpenAutoFocus={(e) => byPointer.current && e.preventDefault()}
      >
        {content}
      </PopoverContent>
    </PopoverRoot>
  );
}
