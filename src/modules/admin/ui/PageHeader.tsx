import type { ReactNode } from "react";
import { Block } from "@/shared/ui/Block";

interface Props {
  title: string;
  description?: string;
  /** Boutons d'action à droite (ex: « Nouveau produit »). Mobile : pleine largeur, 2 par ligne. */
  actions?: ReactNode;
  /** Ligne sous le titre (filtres, onglets…) */
  children?: ReactNode;
}

/** En-tête de page admin : bloc blanc, titre 22px (mobile) / 28/33.6 + description + actions qui s'empilent. */
export function PageHeader({ title, description, actions, children }: Props) {
  return (
    <Block pad="none" className="p-4 sm:px-[30px] sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] leading-[28px] sm:text-h-page">{title}</h1>
          {description && <p className="mt-1 text-[13px] leading-[19px] text-ink-2 sm:text-[14px] sm:leading-[21px]">{description}</p>}
        </div>
        {actions && (
          <div className="grid grid-cols-2 gap-2 max-sm:[&>*]:w-full max-sm:[&>*:only-child]:col-span-2 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2 sm:flex sm:flex-wrap sm:items-center">
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-4 sm:mt-5">{children}</div>}
    </Block>
  );
}
