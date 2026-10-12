"use client";

import { ArrowDown2 } from "@/shared/ui/icons";
import { useId, useState, type ReactNode } from "react";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/lib/cn";
import { BottomSheet } from "./BottomSheet";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "./shadcn/command";
import { Popover, PopoverContent, PopoverTrigger } from "./shadcn/popover";

interface Props<T> {
  /** Résultats déjà filtrés par l'appelant (recherche serveur ou locale). */
  items: T[];
  getKey: (item: T) => string;
  selectedKey?: string | null;
  onSelect: (item: T) => void;
  renderItem: (item: T, selected: boolean) => ReactNode;
  /** Contenu du déclencheur : valeur choisie ou invite. */
  trigger: ReactNode;
  label?: ReactNode;
  /** Nom accessible quand aucun libellé n'est affiché (un combobox ne tire pas son nom de son contenu). */
  ariaLabel?: string;
  required?: boolean;
  error?: string;
  search: string;
  onSearchChange: (q: string) => void;
  searchLabel: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  /** Titre de la feuille mobile */
  sheetTitle: string;
  /** Option fixe en tête de liste (ex. « Tous les revendeurs ») */
  leading?: { label: ReactNode; onSelect: () => void; selected?: boolean };
  onOpenChange?: (open: boolean) => void;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
}

/**
 * Liste déroulante avec recherche (combobox) : flèches haut/bas, Entrée pour choisir, Échap pour fermer
 * (focus rendu au déclencheur). Panneau sous le champ sur desktop, feuille basse sur mobile (< sm).
 */
export function Combobox<T>({
  items, getKey, selectedKey, onSelect, renderItem, trigger, label, ariaLabel, required, error, search, onSearchChange,
  searchLabel, searchPlaceholder = "Rechercher…", emptyText = "Aucun résultat", loading, sheetTitle, leading,
  onOpenChange, className, triggerClassName, panelClassName,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const labelId = useId();
  const triggerId = useId();

  const change = (o: boolean) => {
    setOpen(o);
    onOpenChange?.(o);
  };
  const pick = (fn: () => void) => {
    fn();
    change(false);
  };

  const body = (
    <Command shouldFilter={false} loop label={searchLabel}>
      <CommandInput autoFocus={!isMobile} value={search} onValueChange={onSearchChange} placeholder={searchPlaceholder} aria-label={searchLabel} inputMode="search" className="h-12 sm:h-10" />
      <CommandList className="sm:max-h-[300px]">
        {loading && !items.length ? (
          <p className="px-3 py-4 text-center text-[13px] text-ink-3">Recherche…</p>
        ) : (
          <CommandEmpty>{emptyText}</CommandEmpty>
        )}
        {leading && (
          <CommandItem value="__leading" onSelect={() => pick(leading.onSelect)} data-checked={leading.selected || undefined} className={cn("text-[13px] font-semibold", leading.selected && "bg-primary-50 text-primary")}>
            {leading.label}
          </CommandItem>
        )}
        {items.map((item) => {
          const key = getKey(item);
          const selected = key === selectedKey;
          return (
            <CommandItem key={key} value={key} onSelect={() => pick(() => onSelect(item))} data-checked={selected || undefined} className={cn(selected && "bg-primary-50")}>
              {renderItem(item, selected)}
            </CommandItem>
          );
        })}
      </CommandList>
    </Command>
  );

  const triggerProps = {
    id: triggerId,
    type: "button" as const,
    role: "combobox",
    "aria-haspopup": "listbox" as const,
    "aria-expanded": open,
    "aria-invalid": !!error,
    "aria-labelledby": label ? `${labelId} ${triggerId}` : undefined,
    "aria-label": label ? undefined : ariaLabel,
    className: cn("field flex items-center gap-2 text-left", error && "field-error", triggerClassName),
  };
  const triggerContent = (
    <>
      {trigger}
      <ArrowDown2 size={14} aria-hidden className={cn("ml-auto shrink-0 transition-transform", open && "rotate-180")} />
    </>
  );

  return (
    <div className={cn("relative flex flex-col gap-1.5", className)}>
      {label && (
        <span id={labelId} className="text-[13px] font-semibold leading-[19.5px]">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </span>
      )}
      {isMobile ? (
        <>
          <button {...triggerProps} onClick={() => change(!open)}>
            {triggerContent}
          </button>
          <BottomSheet open={open} onClose={() => change(false)} title={sheetTitle}>
            <div className="pb-3 pt-1">{body}</div>
          </BottomSheet>
        </>
      ) : (
        <Popover open={open} onOpenChange={change}>
          <PopoverTrigger asChild>
            <button {...triggerProps}>{triggerContent}</button>
          </PopoverTrigger>
          <PopoverContent align="start" className={cn("w-(--radix-popover-trigger-width) min-w-[260px] p-2", panelClassName)}>
            {body}
          </PopoverContent>
        </Popover>
      )}
      {error && (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
