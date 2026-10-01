import { Block } from "@/shared/ui/Block";
import { ProductCardSkeleton, Skeleton } from "@/shared/ui/Skeleton";

/** Squelette générique de page boutique (breadcrumb + titre + grille). */
export function PageSkeleton() {
  return (
    <>
      <Block pad="none" className="flex min-h-[81px] items-center px-[30px]"><Skeleton className="h-4 w-48" /></Block>
      <Block>
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </Block>
    </>
  );
}
