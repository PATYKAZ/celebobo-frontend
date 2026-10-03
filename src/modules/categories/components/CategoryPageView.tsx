"use client";

import { Category2 } from "iconsax-reactjs";
import { Suspense } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ProductListView } from "@/modules/products/components/ProductListView";
import { useCategory } from "../hooks/useCategories";
import { CategoryBanner } from "./CategoryBanner";

export function CategoryPageView({ slug }: { slug: string }) {
  const { data: category, isLoading, isError } = useCategory(slug);

  if (isLoading) {
    return (
      <>
        <Breadcrumb items={[{ label: "Catégorie" }]} />
        <Skeleton className="h-[240px] w-full rounded-box" />
        <Block><Skeleton className="h-[500px] w-full" /></Block>
      </>
    );
  }

  if (isError || !category) {
    return (
      <>
        <Breadcrumb items={[{ label: "Catégorie introuvable" }]} />
        <Block>
          <EmptyState
            icon={<Category2 size={44} variant="Bulk" />}
            title="Catégorie introuvable"
            description="Cette catégorie n'existe pas ou a été supprimée."
            action={<Button href={ROUTES.products}>Voir tous les produits</Button>}
          />
        </Block>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Produits", href: ROUTES.products }, { label: category.name }]} />
      <CategoryBanner category={category} />
      <Suspense fallback={<Block><Skeleton className="h-[600px] w-full" /></Block>}>
        <ProductListView locked={{ category: category.slug }} />
      </Suspense>
    </>
  );
}
