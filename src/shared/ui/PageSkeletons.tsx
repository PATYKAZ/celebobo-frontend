import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { ProductCardSkeleton, Skeleton } from "@/shared/ui/Skeleton";

/**
 * Squelettes de pages boutique. Chacun reprend la grille réelle de son écran (mêmes blocs, mêmes
 * colonnes, mêmes espacements) : affichés au clic par `loading.tsx` puis par l'écran pendant le
 * chargement de ses données, sans saut de mise en page entre les deux. Mobile d'abord.
 */

/** Racine annoncée aux lecteurs d'écran ; le contenu visuel est masqué pour eux. */
export function SkeletonRoot({ label = "Chargement de la page", className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={cn("flex flex-col gap-3 sm:gap-4", className)}>
      <span className="sr-only">{label}…</span>
      <div aria-hidden className="contents">{children}</div>
    </div>
  );
}

/** Même gabarit que <Breadcrumb>. */
export function BreadcrumbSkeleton() {
  return (
    <Block pad="none" className="flex min-h-[44px] items-center px-4 sm:min-h-[81px] sm:px-[30px]">
      <Skeleton className="h-4 w-44 max-w-full" />
    </Block>
  );
}

/** Bloc titre + description (en-tête de liste, page de contenu). */
export function TitleBlockSkeleton({ description = true }: { description?: boolean }) {
  return (
    <Block pad="none" className="p-4 sm:px-[30px] sm:py-6">
      <Skeleton className="h-7 w-56 max-w-full sm:h-8" />
      {description && <Skeleton className="mt-3 h-4 w-96 max-w-full" />}
    </Block>
  );
}

export function ProductGridSkeleton({ count = 8, columns = 4, className }: { count?: number; columns?: 4 | 5; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3", columns === 4 ? "xl:grid-cols-4" : "xl:grid-cols-5", className)}>
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

/** Liste filtrable : filtres à gauche (≥ lg), barre d'outils, grille. Produits, catégorie, recherche. */
export function ProductListSkeleton({ header = true }: { header?: boolean }) {
  return (
    <SkeletonRoot label="Chargement des produits">
      <BreadcrumbSkeleton />
      {header && <TitleBlockSkeleton />}
      <Block pad="none" className="grid grid-cols-[minmax(0,1fr)] gap-0 p-3 sm:p-[30px] lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
        <div className="hidden flex-col gap-3 lg:flex">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-7 w-full" />)}
          <Skeleton className="mt-4 h-5 w-16" />
          <Skeleton className="h-7 w-full" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-line-3 pb-3 sm:pb-5">
            <Skeleton className="h-5 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-11 w-24 rounded-box lg:hidden" />
              <Skeleton className="h-11 w-36 rounded-box max-sm:hidden" />
            </div>
          </div>
          <ProductGridSkeleton className="mt-3" />
        </div>
      </Block>
    </SkeletonRoot>
  );
}

/** Fiche produit : galerie + informations, puis onglets. */
export function ProductDetailSkeleton() {
  return (
    <SkeletonRoot label="Chargement du produit">
      <BreadcrumbSkeleton />
      <Block pad="none" className="grid grid-cols-[minmax(0,1fr)] gap-5 p-3 sm:gap-8 sm:p-[30px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <Skeleton className="aspect-4/3 w-full rounded-box md:aspect-square" />
        <div className="flex flex-col gap-4 px-1 sm:px-0">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-10 w-40" />
          <div className="flex flex-col gap-2.5 border-t border-line-3 pt-5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="mt-2 flex gap-3">
            <Skeleton className="h-12 w-32 rounded-box" />
            <Skeleton className="h-12 flex-1 rounded-box sm:max-w-48" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 rounded-box" />)}
          </div>
        </div>
      </Block>
      <Block pad="none" className="p-4 sm:p-[30px]">
        <div className="flex gap-6 border-b border-line-3 pb-3">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-5 w-24" />)}
        </div>
        <Skeleton className="mt-5 h-4 w-full" />
        <Skeleton className="mt-2.5 h-4 w-5/6" />
      </Block>
    </SkeletonRoot>
  );
}

/** Colonne principale + récapitulatif de 380 px : panier et commande. */
export function CartLayoutSkeleton({ label = "Chargement du panier", lines = 3, breadcrumb = true }: { label?: string; lines?: number; breadcrumb?: boolean }) {
  return (
    <SkeletonRoot label={label}>
      {breadcrumb && <BreadcrumbSkeleton />}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_380px]">
        <Block pad="none" className="p-4 sm:p-[30px]">
          <Skeleton className="h-7 w-44" />
          <div className="mt-4 divide-y divide-line-3">
            {Array.from({ length: lines }, (_, i) => (
              <div key={i} className="flex gap-3 py-4 sm:gap-4">
                <Skeleton className="size-20 shrink-0 rounded-box sm:size-24" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3.5 w-24" />
                  <div className="mt-auto flex items-center justify-between">
                    <Skeleton className="h-9 w-28 rounded-box" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Block>
        <Block pad="none" className="flex flex-col gap-3 p-4 sm:p-[30px]">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-full rounded-box" />
          <Skeleton className="mt-2 h-6 w-full" />
          <Skeleton className="h-12 w-full rounded-box" />
        </Block>
      </div>
    </SkeletonRoot>
  );
}

/** Espace client : menu de 360 px (≥ lg) + contenu. */
export function AccountSkeleton({ breadcrumb = true }: { breadcrumb?: boolean }) {
  return (
    <SkeletonRoot label="Chargement de votre compte">
      {breadcrumb && <BreadcrumbSkeleton />}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Block pad="sm" className="flex flex-col gap-2 p-2! max-lg:hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </Block>
        <Block pad="none" className="p-4 sm:p-[30px]">
          <Skeleton className="h-7 w-48" />
          <div className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-12 w-full rounded-box sm:h-[45px]" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-12 w-40 rounded-box" />
        </Block>
      </div>
    </SkeletonRoot>
  );
}

/** Lignes empilées (commandes, notifications, adresses…). */
export function ListPageSkeleton({ label = "Chargement", rows = 5, breadcrumb = true }: { label?: string; rows?: number; breadcrumb?: boolean }) {
  return (
    <SkeletonRoot label={label}>
      {breadcrumb && <BreadcrumbSkeleton />}
      <Block pad="none" className="p-4 sm:p-[30px]">
        <Skeleton className="h-7 w-52" />
        <div className="mt-5 flex flex-col gap-3">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-box border border-line-3 p-3 sm:p-4">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3.5 w-1/3" />
              </div>
              <Skeleton className="h-6 w-16 shrink-0 max-sm:hidden" />
            </div>
          ))}
        </div>
      </Block>
    </SkeletonRoot>
  );
}

/** Messagerie : liste des discussions (360 px) + fil, une seule colonne sur mobile. */
export function MessagesSkeleton() {
  return (
    <SkeletonRoot label="Chargement des messages">
      <div className="hidden lg:block"><BreadcrumbSkeleton /></div>
      <Block pad="none" className="lg:grid lg:min-h-[560px] lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-1 p-3 lg:border-r lg:border-line-3">
          <Skeleton className="mb-2 h-11 w-full rounded-box" />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden flex-col justify-end gap-3 p-6 lg:flex">
          <Skeleton className="h-12 w-2/3 rounded-box" />
          <Skeleton className="ml-auto h-12 w-1/2 rounded-box" />
          <Skeleton className="h-12 w-3/5 rounded-box" />
          <Skeleton className="mt-4 h-12 w-full rounded-box" />
        </div>
      </Block>
    </SkeletonRoot>
  );
}

/** Page de contenu (à propos, guide, pages CMS, contact, devenir revendeur). */
export function ContentPageSkeleton({ breadcrumb = true }: { breadcrumb?: boolean }) {
  return (
    <SkeletonRoot>
      {breadcrumb && <BreadcrumbSkeleton />}
      <Block pad="none" className="p-4 sm:p-[30px]">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="mt-6 h-44 w-full rounded-box sm:h-64" />
        <div className="mt-6 flex flex-col gap-2.5">
          {["w-full", "w-11/12", "w-full", "w-4/5", "w-2/3"].map((w, i) => <Skeleton key={i} className={cn("h-4", w)} />)}
        </div>
      </Block>
    </SkeletonRoot>
  );
}

/** Formulaire centré (connexion, inscription, suivi de commande…). */
export function FormPageSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <SkeletonRoot>
      <BreadcrumbSkeleton />
      <Block className="mx-auto w-full max-w-[560px]">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto mt-3 h-4 w-64 max-w-full" />
        <div className="mt-6 flex flex-col gap-4">
          {Array.from({ length: fields }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-12 w-full rounded-box sm:h-[45px]" />
            </div>
          ))}
          <Skeleton className="mt-2 h-12 w-full rounded-box" />
        </div>
      </Block>
    </SkeletonRoot>
  );
}

/** Accueil : menu catégories + carrousel, rangée de catégories, grille de produits. */
export function HomeSkeleton() {
  return (
    <SkeletonRoot label="Chargement de l'accueil">
      {/* même grille que HeroSection : menu 309 px | carrousel | bannières 309 px (xl) */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-[309px_minmax(0,1fr)] xl:grid-cols-[309px_minmax(0,1fr)_309px]">
        <Block pad="none" className="hidden flex-col gap-4 p-[30px] lg:flex">
          {Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </Block>
        <Skeleton className="aspect-[16/10] w-full rounded-box! sm:aspect-[21/9] lg:aspect-auto lg:min-h-[310px]" />
        <div className="hidden flex-col gap-3 xl:flex">
          <Skeleton className="h-[148px] w-full rounded-box!" />
          <Skeleton className="h-[148px] w-full rounded-box!" />
        </div>
      </div>
      <Block pad="none" className="flex gap-4 overflow-hidden p-4 sm:p-[30px]">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-2">
            <Skeleton className="size-16 rounded-full sm:size-20" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </Block>
      <Block pad="none" className="p-3 sm:p-[30px]">
        <Skeleton className="mb-3 h-6 w-48" />
        <ProductGridSkeleton count={10} columns={5} />
      </Block>
    </SkeletonRoot>
  );
}
