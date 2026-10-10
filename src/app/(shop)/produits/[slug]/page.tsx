import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ProductDetailView } from "@/modules/products/components/ProductDetailView";
import { productKeys } from "@/modules/products/keys";
import { loadProduct, productMetadata, ProductJsonLd } from "@/modules/products/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await loadProduct((await params).slug);
  return product ? productMetadata(product) : { title: "Produit" };
}

/** Fiche rendue côté serveur (SEO, aperçus de partage) puis reprise par React Query côté client. */
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { product, notFound: missing } = await loadProduct(slug);
  if (missing) notFound();
  const qc = new QueryClient();
  if (product) qc.setQueryData(productKeys.detail(slug), product);
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      {product && <ProductJsonLd product={product} />}
      <ProductDetailView slug={slug} />
    </HydrationBoundary>
  );
}
