"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { SearchNormal1 } from "iconsax-reactjs"

import { cn } from "@/shared/lib/cn"

/**
 * Command (cmdk) au style Swoo : liste filtrable au clavier (flèches, Entrée), sémantique combobox/listbox.
 * Écrit à la main plutôt que via la CLI : la version du registre réécrirait dialog.tsx (personnalisé).
 */
function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return <CommandPrimitive data-slot="command" className={cn("flex w-full flex-col text-popover-foreground", className)} {...props} />
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="relative mb-2">
      <SearchNormal1 size={15} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
      <CommandPrimitive.Input data-slot="command-input" className={cn("field pl-9", className)} {...props} />
    </div>
  )
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List data-slot="command-list" className={cn("overflow-y-auto overscroll-contain", className)} {...props} />
}

function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty data-slot="command-empty" className={cn("px-3 py-4 text-center text-[13px] text-ink-3", className)} {...props} />
}

function CommandLoading({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Loading>) {
  return <CommandPrimitive.Loading data-slot="command-loading" className={cn("px-3 py-4 text-center text-[13px] text-ink-3", className)} {...props} />
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return <CommandPrimitive.Group data-slot="command-group" className={cn("[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-ink-3", className)} {...props} />
}

/** Option : surlignée au survol comme au clavier (data-selected), cochée si data-checked. */
function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "flex w-full cursor-pointer select-none items-center gap-3 rounded-md px-2.5 py-2 text-left outline-none transition-colors data-[selected=true]:bg-chip data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator data-slot="command-separator" className={cn("my-1 h-px bg-line-3", className)} {...props} />
}

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandLoading, CommandSeparator }
