"use client";

import type { ReactNode } from "react";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/lib/cn";
import { Dialog, DialogClose, DialogContent, DialogTitle, OverlayCloseButton } from "./shadcn/dialog";
import { Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerTitle } from "./shadcn/drawer";

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
 * Feuille modale ancrée en bas (mobile, vaul) — poignée, glisser vers le bas pour fermer, zone sûre iOS.
 * Sur grand écran (≥ sm) elle devient une modale centrée.
 */
export function BottomSheet({ open, onClose, title, action, children, className, maxVh = 86 }: Props) {
  const desktop = useMediaQuery("(min-width: 640px)");
  const onOpenChange = (o: boolean) => {
    if (!o) onClose();
  };

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          style={{ maxHeight: `${maxVh}vh` }}
          className={cn("max-w-[560px] overflow-hidden p-0 sm:p-0", className)}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-5">
            <DialogTitle className="text-[16px] leading-[22px]">{title}</DialogTitle>
            <div className="flex items-center gap-3">
              {action}
              <DialogClose asChild>
                <OverlayCloseButton className="size-8" />
              </DialogClose>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-safe">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined} style={{ maxHeight: `${maxVh}dvh` }} className={className}>
        <DrawerHeader action={action}>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>{children}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
