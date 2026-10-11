import "server-only";
import type { Metadata } from "next";
import { cache } from "react";
import { ENDPOINTS } from "@/config/endpoints";
import { SITE } from "@/config/site";
import { siteUrl } from "@/config/site-url";
import { serverGet } from "@/shared/lib/api/server";
import { loadSettings } from "@/modules/site/server";
import { toProduct, type ProductDetailDto } from "./services/products.mapper";
import type { Product } from "./types";
import { getPricing } from "./utils";

/** Étiquette de cache Next d'une fiche (revalidation à la demande depuis Django, cf. BACKEND_CHANGES P1-3). */
export const productTag = (slug: string) => `product:${slug}`;

/**
 * Fiche produit côté serveur, une seule requête par rendu (métadonnées + page).
 * `product: null` : API indisponible → la page se charge dans le navigateur comme avant.
 */
export const loadProduct = cache(async (slug: string): Promise<{ product: Product | null; notFound: boolean }> => {
  const res = await serverGet<ProductDetailDto>(ENDPOINTS.products.detail(slug), { tags: [productTag(slug)] });
  if (res.ok) return { product: toProduct(res.data), notFound: false };
  return { product: null, notFound: res.status === 404 };
});

const excerpt = (text: string, max = 158) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export function productMetadata(product: Product): Metadata {
  const path = `/produits/${product.slug}`;
  // champs SEO saisis dans le back-office en priorité, sinon nom / description du produit
  const title = product.seoTitle || product.name;
  const description = excerpt(product.seoDescription || product.description || product.longDescription || `${product.name} chez ${SITE.name}.`);
  const images = (product.images.length ? product.images : product.image ? [product.image] : []).slice(0, 4);
  return {
    title,
    description,
    alternates: { canonical: path },
    // openGraph remplace celui du layout (pas de fusion) : siteName / locale répétés
    openGraph: { type: "website", siteName: SITE.name, locale: "fr_CD", url: path, title, description, images },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images },
  };
}

/** Données structurées schema.org/Product (résultats enrichis : prix, disponibilité, note). */
export async function ProductJsonLd({ product }: { product: Product }) {
  const url = `${siteUrl()}/produits/${product.slug}`;
  const priceCurrency = (await loadSettings())?.currency ?? "USD";
  const { current } = getPricing(product);
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images.length ? product.images : product.image ? [product.image] : undefined,
    category: product.category || undefined,
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency,
      price: current.toFixed(2),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviewsCount > 0 && product.rating
        ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewsCount }
        : undefined,
  };
  // « < » échappé : un texte produit ne peut pas refermer la balise <script>
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
