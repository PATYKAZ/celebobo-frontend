import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface Props {
  children: ReactNode;
  className?: string;
  /**
   * `mobile` (défaut) : barre fixe en bas SOUS lg uniquement, posée au-dessus de la barre d'onglets
   * (`bottom-tabbar`, qui vaut 0 quand la barre est masquée) et de la zone sûre iOS ; en ≥ lg elle devient
   * un simple bloc dans le flux. `always` : fixe sur toutes les tailles.
   */
  mode?: "mobile" | "always";
}

/**
 * Barre d'actions collante (« Enregistrer », « Passer la commande », « Ajouter au panier »…).
 * Réserve automatiquement sa place : ajoute `<div className="h-20 lg:hidden" />` (ou `pb-24`) sous le contenu
 * du formulaire pour que le dernier champ ne soit pas masqué.
 */
export function StickyActionBar({ children, className, mode = "mobile" }: Props) {
  return (
    <div
      className={cn(
        "z-40 flex items-center gap-3 border-t border-line-3 bg-white/95 px-4 py-3 backdrop-blur-xl",
        // posée au-dessus de la barre d'onglets ; si elle est masquée (--tabbar-h = 0) on respecte la zone sûre iOS
        mode === "mobile"
          ? "fixed inset-x-0 bottom-[max(var(--tabbar-h),env(safe-area-inset-bottom))] lg:static lg:rounded-box lg:border lg:bg-white lg:px-5 lg:py-4"
          : "fixed inset-x-0 bottom-[max(var(--tabbar-h),env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
