import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** fondu aux deux bords sur mobile (indique qu'il y a du contenu à faire défiler) */
  fade?: boolean;
  /** pleine largeur écran sur mobile : annule le padding horizontal du parent (`-mx-4 px-4`) */
  bleed?: boolean;
  /** Reste en rangée défilante aussi à partir de `sm` (défaut : s'enroule en flex-wrap dès sm) */
  alwaysScroll?: boolean;
}

/**
 * Rangée horizontale défilante avec accroche (snap) — chips de filtres, cartes de stats, mini-cartes.
 * Enfants : `shrink-0` + `snap-start` automatiques. Sur ≥ sm la rangée s'enroule (flex-wrap) sauf `alwaysScroll`.
 * Espacement : `className="gap-2"` (défaut gap-2).
 */
export function ScrollRow({ fade = true, bleed, alwaysScroll, className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        "no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth [&>*]:shrink-0 [&>*]:snap-start",
        fade && "[mask-image:linear-gradient(90deg,transparent,#000_16px,#000_calc(100%-16px),transparent)] sm:[mask-image:none]",
        !alwaysScroll && "sm:flex-wrap sm:overflow-visible",
        bleed && "-mx-4 px-4 sm:mx-0 sm:px-0",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
