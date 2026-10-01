"use client";

import { Bag2, Box1 } from "iconsax-reactjs";
import Image from "next/image";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Reveal } from "@/shared/animations/Reveal";
import { formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useProduct } from "../hooks/useProducts";
import { useRecentlyViewedStore } from "../store/recently-viewed.store";
import { getPricing } from "../utils";
import { ProductGallery } from "./ProductGallery";
import { ProductInfo } from "./ProductInfo";
import { ProductTabs } from "./ProductTabs";
import { RelatedProducts } from "./RelatedProducts";

export function ProductDetailView({ id }: { id: number }) {
  const { data: product, isLoading, isError } = useProduct(Number.isFinite(id) ? id : undefined);
  const { add } = useCart();

  useEffect(() => {
    if (product) useRecentlyViewedStore.getState().track(product);
  }, [product]);

  if (isLoading) {
    return (
      <>
        <Breadcrumb items={[{ label: "Produits", href: ROUTES.products }, { label: "…" }]} />
        <Block className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-box" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Block>
      </>
    );
  }

  if (isError || !product) {
    return (
      <>
        <Breadcrumb items={[{ label: "Produits", href: ROUTES.products }, { label: "Produit introuvable" }]} />
        <Block>
          <EmptyState
            icon={<Box1 size={44} variant="Bulk" />}
            title="Produit introuvable"
            description="Ce produit n'existe plus ou a été retiré du catalogue."
            action={<Button href={ROUTES.products}>Voir les produits</Button>}
          />
        </Block>
      </>
    );
  }

  const pricing = getPricing(product);

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Produits", href: ROUTES.products },
          ...(product.categoryId ? [{ label: product.category, href: ROUTES.category(product.categoryId) }] : []),
          { label: product.name },
        ]}
      />
      <Reveal>
        <Block className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <ProductGallery product={product} />
          <ProductInfo product={product} />
        </Block>
      </Reveal>
      <Reveal>
        <Block>
          <ProductTabs product={product} />
        </Block>
      </Reveal>
      <RelatedProducts productId={product.id} />

      {/* Barre d'achat collante (mobile) */}
      <div className="h-16 lg:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line-3 bg-white p-3 lg:hidden">
        {product.image && (
          <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-page">
            <Image src={product.image} alt="" fill sizes="44px" className="object-cover" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] text-ink-2">{product.name}</p>
          <p className={`text-[16px] font-bold ${pricing.onSale ? "text-danger" : ""}`}>{formatPrice(pricing.current)}</p>
        </div>
        <Button size="md" disabled={!product.inStock} onClick={() => add(product)} leftIcon={<Bag2 size={17} variant="Bold" />}>
          Ajouter
        </Button>
      </div>
    </>
  );
}
