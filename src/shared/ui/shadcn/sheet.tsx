"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/cn"
import { OverlayCloseButton } from "./dialog"

/** Panneau latéral shadcn/Radix au style Swoo (menu mobile, filtres, détails admin). */
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-[90] bg-black/50 duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

/** Largeur : plein écran sur mobile, 88 % plafonné à 360px au-delà (surcharger avec `sm:max-w-[…]`). */
function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "left" | "right"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-[90] flex w-full flex-col bg-popover text-popover-foreground outline-none sm:w-[88%] sm:max-w-[360px]",
          "duration-300 ease-[cubic-bezier(.22,1,.36,1)] data-open:animate-in data-closed:animate-out",
          side === "left"
            ? "left-0 data-open:slide-in-from-left data-closed:slide-out-to-left"
            : "right-0 data-open:slide-in-from-right data-closed:slide-out-to-right",
          className
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

/** En-tête : titre + bouton Fermer, sous la zone sûre iOS. */
function SheetHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex shrink-0 items-center justify-between gap-3 border-b border-line-3 px-5 pb-4 pt-[max(16px,env(safe-area-inset-top))]", className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close asChild>
        <OverlayCloseButton className="-mr-1.5" />
      </SheetPrimitive.Close>
    </div>
  )
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 border-t border-line-3 p-4", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("text-[18px] font-bold leading-[24px]", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-[13px] text-muted-foreground", className)} {...props} />
  )
}

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
