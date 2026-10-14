"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/shared/lib/cn"
import { OverlayCloseButton } from "./dialog"

/**
 * Feuille basse (vaul) au style Swoo : glisser vers le bas pour fermer, poignée, zone sûre iOS.
 * Piège du focus, Échap et verrouillage du défilement fournis par Radix Dialog (sous-jacent à vaul).
 */
function Drawer({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn("fixed inset-0 z-[95] bg-black/45 backdrop-blur-[2px]", className)}
      {...props}
    />
  )
}

function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[95] mx-auto flex max-h-[calc(var(--dvh)*86)] w-full flex-col rounded-t-[22px] bg-popover text-popover-foreground outline-none",
          className
        )}
        {...props}
      >
        <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-11 shrink-0 rounded-full bg-line" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

/** En-tête : titre (+ action facultative) et bouton Fermer. */
function DrawerHeader({ className, children, action, ...props }: React.ComponentProps<"div"> & { action?: React.ReactNode }) {
  return (
    <div data-slot="drawer-header" className={cn("flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3", className)} {...props}>
      {children}
      <div className="flex items-center gap-3">
        {action}
        <DrawerPrimitive.Close asChild>
          <OverlayCloseButton className="size-8" />
        </DrawerPrimitive.Close>
      </div>
    </div>
  )
}

function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-body" className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-safe", className)} {...props} />
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2 p-4 pb-safe", className)} {...props} />
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title data-slot="drawer-title" className={cn("text-[16px] font-bold leading-[22px]", className)} {...props} />
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return <DrawerPrimitive.Description data-slot="drawer-description" className={cn("text-[13px] text-muted-foreground", className)} {...props} />
}

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
}
