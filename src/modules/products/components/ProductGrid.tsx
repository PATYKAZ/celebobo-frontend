"use client";

import { RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";
import { ProductCardSkeleton } from "@/shared/ui/Skeleton";
import type { Product } from "../types";
import { ProductCard } from "./ProductCard";

interface Props {
  products?: Product[];
  loading?: boolean;
  /** Nombre de squelettes pendant le chargement. */
  skeletons?: number;
  /** Colonnes max (≥ 1280px). Défaut 5 = pleine largeur ; 4 avec sidebar. */
  columns?: 3 | 4 | 5;
  className?: string;
}

const COLS = {
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
};

/** Grille responsive de cartes produit (2 → 3 → 4/5 colonnes), avec apparition en cascade. */
export function ProductGrid({ products, loading, skeletons = 10, columns = 5, className }: Props) {
  if (loading) {
    return (
      <div className={cn("grid", COLS[columns], className)}>
        {Array.from({ length: skeletons }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <RevealGroup stagger={0.05} className={cn("grid", COLS[columns], className)}>
      {products?.map((p, i) => (
        <RevealItem key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
