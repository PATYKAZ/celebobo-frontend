import type { ReactNode } from "react";
import { Block } from "@/shared/ui/Block";

interface Props {
  title: string;
  description?: string;
  /** Boutons d'action à droite (ex: « Nouveau produit »). */
  actions?: ReactNode;
  /** Ligne sous le titre (filtres, onglets…) */
  children?: ReactNode;
}

/** En-tête de page admin : bloc blanc, titre 28/33.6 + description + actions. */
export function PageHeader({ title, description, actions, children }: Props) {
  return (
    <Block pad="none" className="px-5 py-5 sm:px-[30px] sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h-page">{title}</h1>
          {description && <p className="mt-1 text-[14px] leading-[21px] text-ink-2">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </Block>
  );
}
