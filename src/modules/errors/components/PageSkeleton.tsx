import { Block } from "@/shared/ui/Block";
import { ProductCardSkeleton, Skeleton } from "@/shared/ui/Skeleton";

/** Squelette générique de page boutique (breadcrumb + titre + grille). */
export function PageSkeleton() {
  return (
    <>
      <Block pad="none" className="flex min-h-[44px] items-center px-4 sm:min-h-[81px] sm:px-[30px]"><Skeleton className="h-4 w-48 max-w-full" /></Block>
      <Block pad="none" className="p-4 sm:p-[30px]">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </Block>
    </>
  );
}
