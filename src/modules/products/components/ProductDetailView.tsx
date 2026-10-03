"use client";

import { Add, Bag2, Box1, Minus } from "iconsax-reactjs";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Reveal } from "@/shared/animations/Reveal";
import { formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useProduct, useProductReviews, useRelatedProducts } from "../hooks/useProducts";
import { useVariantSelection } from "../hooks/useVariantSelection";
import type { Product } from "../types";
import { useRecentlyViewedStore } from "../store/recently-viewed.store";
import { getPricing } from "../utils";
import { ProductGallery } from "./ProductGallery";
import { ProductInfo } from "./ProductInfo";
import { ProductTabs } from "./ProductTabs";
import { RelatedProducts } from "./RelatedProducts";

/** Contenu de la fiche (monté une fois le produit chargé : la sélection de variante dépend du produit). */
function ProductContent({ product }: { product: Product }) {
  const { add } = useCart();
  const selection = useVariantSelection(product);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    useRecentlyViewedStore.getState().track(product);
  }, [product]);

  // la barre d'achat collante réserve 72px : le bouton « haut de page » remonte d'autant
  useEffect(() => {
    // très petits écrans (≤ 359px, ex. iPhone SE) : la barre passe sur deux lignes
    document.documentElement.style.setProperty("--buybar-h", window.innerWidth < 360 ? "120px" : "72px");
    return () => {
      document.documentElement.style.removeProperty("--buybar-h");
    };
  }, []);

  const pricing = getPricing(product);
  const current = pricing.current + selection.priceDelta;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Produits", href: ROUTES.products },
          ...(product.categoryId ? [{ label: product.category, href: ROUTES.category(product.categorySlug) }] : []),
          { label: product.name },
        ]}
      />
      <Reveal>
        <Block pad="none" className="grid grid-cols-[minmax(0,1fr)] gap-5 p-3 sm:gap-8 sm:p-[30px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <ProductGallery product={product} activeImage={selection.image} />
          <ProductInfo product={product} selection={selection} qty={qty} onQtyChange={setQty} />
        </Block>
      </Reveal>
      <Reveal>
        <Block pad="none" className="p-4 sm:p-[30px]">
          <ProductTabs product={product} />
        </Block>
      </Reveal>
      <RelatedProducts slug={product.slug} />

      {/* Barre d'achat collante (mobile) : au-dessus de la barre d'onglets */}
      <div className="h-[72px] max-[359px]:h-[120px] lg:hidden" />
      <div className="fixed inset-x-0 bottom-tabbar z-40 border-t border-line-3 bg-white/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[640px] flex-wrap items-center gap-2.5 px-3 py-2.5">
          <div className="min-w-0 flex-1 max-[359px]:basis-full">
            <p className={`truncate text-[17px] font-bold leading-[22px] ${pricing.onSale ? "text-danger" : ""}`}>{formatPrice(current * qty)}</p>
            <p className="truncate text-[11px] leading-[14px] text-ink-3">{qty > 1 ? `${qty} × ${formatPrice(current)}` : selection.inStock ? "En stock" : "Rupture de stock"}</p>
          </div>
          <div className="inline-flex shrink-0 items-center overflow-hidden rounded-box border border-line bg-white">
            <button aria-label="Diminuer" disabled={qty <= 1} onClick={() => setQty(qty - 1)} className="grid size-11 place-items-center active:bg-chip disabled:opacity-40"><Minus size={16} /></button>
            <span aria-live="polite" className="min-w-7 text-center text-[14px] font-semibold tabular-nums">{qty}</span>
            <button aria-label="Augmenter" disabled={qty >= Math.max(1, selection.stock)} onClick={() => setQty(qty + 1)} className="grid size-11 place-items-center active:bg-chip disabled:opacity-40"><Add size={16} /></button>
          </div>
          <Button size="md" disabled={!selection.inStock} onClick={() => add(product, qty, { variantId: selection.variant?.id ?? null, variantLabel: selection.variant?.label ?? null, priceDelta: selection.priceDelta })} leftIcon={<Bag2 size={17} variant="Bold" />} upper={false} className="shrink-0 px-4 max-[359px]:flex-1">
            Ajouter
          </Button>
        </div>
      </div>
    </>
  );
}

export function ProductDetailView({ slug }: { slug: string }) {
  const { data: product, isLoading, isError } = useProduct(slug);
  // lancés en même temps que la fiche (même cache que les onglets avis et « produits similaires »)
  useProductReviews(slug);
  useRelatedProducts(slug);

  if (isLoading) {
    return (
      <>
        <Breadcrumb items={[{ label: "Produits", href: ROUTES.products }, { label: "…" }]} />
        <Block pad="none" className="grid gap-5 p-3 sm:gap-8 sm:p-[30px] lg:grid-cols-2">
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

  return <ProductContent key={product.id} product={product} />;
}
