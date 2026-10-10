"use client";

import type { ReactNode } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle, OverlayCloseButton } from "./shadcn/dialog";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "./shadcn/sheet";

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

const closeOn = (onClose: () => void) => (open: boolean) => {
  if (!open) onClose();
};

/**
 * Modale : feuille ancrée en bas sur mobile, centrée au-delà (Radix Dialog : focus piégé puis rendu
 * au déclencheur, Échap ne ferme que la couche du dessus). `className` fixe la largeur (`max-w-[…]`).
 */
export function Modal({ open, onClose, title, children, className }: BaseProps) {
  return (
    <Dialog open={open} onOpenChange={closeOn(onClose)}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className={className}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <DialogTitle className={title ? undefined : "sr-only"}>{title ?? "Fenêtre"}</DialogTitle>
          <DialogClose asChild>
            <OverlayCloseButton className="-mr-1.5 -mt-1 ml-auto" />
          </DialogClose>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** Panneau latéral (menu mobile, filtres, détails). Largeur desktop : `className="sm:max-w-[…]"`. */
export function Drawer({ open, onClose, title, children, className, side = "left" }: BaseProps & { side?: "left" | "right" }) {
  return (
    <Sheet open={open} onOpenChange={closeOn(onClose)}>
      <SheetContent side={side} aria-describedby={undefined} className={className}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <SheetBody>{children}</SheetBody>
      </SheetContent>
    </Sheet>
  );
}
