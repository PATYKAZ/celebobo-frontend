import { cn } from "@/shared/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/** Squelette d'une carte produit (même gabarit que ProductCard). */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <Skeleton className="aspect-square w-full rounded-box" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-5 w-20" />
    </div>
  );
}
