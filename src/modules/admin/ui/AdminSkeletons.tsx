import { Block } from "@/shared/ui/Block";
import { SkeletonRoot } from "@/shared/ui/PageSkeletons";
import { Skeleton } from "@/shared/ui/Skeleton";

/**
 * Squelettes du back-office, affichés dans AdminShell (menu et en-tête restent en place) au clic sur un
 * lien (`loading.tsx`) et pendant le premier contrôle de session. Mêmes blocs que PageHeader / StatCard /
 * DataTable. Mobile d'abord : cartes empilées, tableau réduit à des lignes.
 */

/** Même gabarit que <PageHeader>. */
export function PageHeaderSkeleton({ actions = 1 }: { actions?: number }) {
  return (
    <Block pad="none" className="p-4 sm:px-[30px] sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48 sm:h-8" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        {actions > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {Array.from({ length: actions }, (_, i) => <Skeleton key={i} className="h-11 rounded-box only:col-span-2 sm:w-40" />)}
          </div>
        )}
      </div>
    </Block>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Block key={i} pad="none" className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-10 shrink-0 rounded-full max-sm:hidden" />
          </div>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3.5 w-20" />
        </Block>
      ))}
    </div>
  );
}

/** Tableau : en-têtes + lignes sur desktop, cartes compactes sur mobile (comme DataTable). */
export function TableSkeleton({ rows = 8, filters = true }: { rows?: number; filters?: boolean }) {
  return (
    <Block pad="none" className="p-3 sm:p-6">
      {filters && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-11 w-full rounded-box sm:max-w-80" />
          <Skeleton className="h-11 w-full rounded-box sm:w-40" />
        </div>
      )}
      <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 border-b border-line-3 pb-3 md:grid">
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-3.5 w-20" />)}
      </div>
      <div className="divide-y divide-line-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-3.5 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_80px] md:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-box" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3 md:hidden" />
              </div>
            </div>
            <Skeleton className="h-4 w-16 max-md:hidden" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-14 max-md:hidden" />
            <Skeleton className="h-8 w-8 rounded-full max-md:hidden" />
          </div>
        ))}
      </div>
    </Block>
  );
}

/** Page de liste : en-tête, indicateurs, tableau. Défaut de tout le back-office. */
export function AdminPageSkeleton({ stats = true }: { stats?: boolean }) {
  return (
    <SkeletonRoot label="Chargement de la page">
      <PageHeaderSkeleton />
      {stats && <StatCardsSkeleton />}
      <TableSkeleton />
    </SkeletonRoot>
  );
}

/** Formulaire en sections (produit, vente) : sections empilées + barre d'actions. */
export function AdminFormSkeleton({ sections = 4 }: { sections?: number }) {
  return (
    <SkeletonRoot label="Chargement du formulaire">
      <PageHeaderSkeleton actions={0} />
      {Array.from({ length: sections }, (_, s) => (
        <Block key={s} pad="none" className="p-4 sm:p-[30px]">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-3.5 w-72 max-w-full" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: s === 0 ? 3 : 2 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2 first:sm:col-span-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-12 w-full rounded-box sm:h-[45px]" />
              </div>
            ))}
          </div>
        </Block>
      ))}
      <Block pad="none" className="flex justify-end gap-2 p-4 sm:px-[30px]">
        <Skeleton className="h-12 flex-1 rounded-box sm:w-32 sm:flex-none" />
        <Skeleton className="h-12 flex-1 rounded-box sm:w-40 sm:flex-none" />
      </Block>
    </SkeletonRoot>
  );
}

/** Fiche détaillée (commande, produit) : contenu principal + colonne latérale. */
export function AdminDetailSkeleton() {
  return (
    <SkeletonRoot label="Chargement">
      <PageHeaderSkeleton actions={2} />
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-3 sm:gap-4">
          <Block pad="none" className="p-4 sm:p-[30px]">
            <Skeleton className="h-6 w-40" />
            <div className="mt-4 divide-y divide-line-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 py-3.5">
                  <Skeleton className="size-14 shrink-0 rounded-box" />
                  <div className="flex flex-1 flex-col gap-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3.5 w-24" /></div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </Block>
          <Block pad="none" className="p-4 sm:p-[30px]">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2.5 h-4 w-4/5" />
          </Block>
        </div>
        <div className="flex flex-col gap-3 sm:gap-4">
          {Array.from({ length: 2 }, (_, i) => (
            <Block key={i} pad="none" className="flex flex-col gap-3 p-4 sm:p-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Block>
          ))}
        </div>
      </div>
    </SkeletonRoot>
  );
}

/** Messagerie admin : liste + fil (une colonne sur mobile). */
export function AdminInboxSkeleton() {
  return (
    <SkeletonRoot label="Chargement des messages">
      <Block pad="none" className="lg:grid lg:h-[calc(100vh-150px)] lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-1 p-3 lg:border-r lg:border-line-3">
          <Skeleton className="mb-2 h-11 w-full rounded-box" />
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3.5 w-4/5" /></div>
            </div>
          ))}
        </div>
        <div className="hidden flex-col justify-end gap-3 p-6 lg:flex">
          <Skeleton className="h-12 w-2/3 rounded-box" />
          <Skeleton className="ml-auto h-12 w-1/2 rounded-box" />
          <Skeleton className="mt-4 h-12 w-full rounded-box" />
        </div>
      </Block>
    </SkeletonRoot>
  );
}

/**
 * Enveloppe complète (menu latéral + en-tête + page) : premier affichage du back-office, pendant que la
 * session est vérifiée. Évite le spinner plein écran.
 */
export function AdminShellSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1760px] gap-4 p-3 sm:p-4">
      <div aria-hidden className="sticky top-4 hidden h-[calc(100vh-32px)] w-[270px] shrink-0 flex-col gap-3 rounded-box bg-surface p-5 lg:flex">
        <Skeleton className="h-10 w-40" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-9 w-full rounded-box" />)}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
        <div aria-hidden className="flex items-center gap-3 rounded-box bg-surface px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex flex-1 flex-col gap-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-36" /></div>
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>
        <AdminPageSkeleton />
      </div>
    </div>
  );
}
