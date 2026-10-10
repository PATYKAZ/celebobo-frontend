"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/cn"

/**
 * AlertDialog shadcn/Radix au style Swoo (confirmations) : role="alertdialog", pas de fermeture au clic
 * sur le fond, focus initial sur « Annuler ». Feuille basse sur mobile, modale centrée au-delà.
 */
function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
}

function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-[90] bg-black/50 backdrop-blur-[2px] duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[90] mx-auto flex w-full max-w-[440px] flex-col rounded-t-[22px] bg-popover p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-popover-foreground outline-none",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-box sm:p-6",
          "duration-200 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-10 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-10",
          "sm:data-open:slide-in-from-bottom-0 sm:data-open:zoom-in-95 sm:data-closed:slide-out-to-bottom-0 sm:data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-dialog-header" className={cn("flex flex-col items-center text-center", className)} {...props} />
}

/** Boutons empilés sur mobile (action principale en premier), côte à côte au-delà. */
function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("mt-5 flex w-full flex-col-reverse gap-2.5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3", className)}
      {...props}
    />
  )
}

/** Pastille d'icône au-dessus du titre. */
function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-dialog-media" className={cn("grid size-14 place-items-center rounded-full sm:size-16", className)} {...props} />
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("mt-3 text-[18px] font-bold leading-[26px] sm:mt-4 sm:text-[20px] sm:leading-[28px]", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("mt-2 text-[14px] leading-[22px] text-muted-foreground", className)}
      {...props}
    />
  )
}

/** Ferme la boîte au clic : à réserver aux actions synchrones (sinon un bouton simple + fermeture au succès). */
function AlertDialogAction({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action data-slot="alert-dialog-action" {...props} />
}

function AlertDialogCancel({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" {...props} />
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
