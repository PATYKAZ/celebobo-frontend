import "server-only";
import type { Metadata } from "next";
import { cache } from "react";
import { ENDPOINTS } from "@/config/endpoints";
import { SITE } from "@/config/site";
import { serverGet } from "@/shared/lib/api/server";
import { toCategory, type CategoryDto } from "./services/categories.mapper";
import type { Category } from "./types";

/** Étiquette de cache Next d'une catégorie (revalidation à la demande, cf. BACKEND_CHANGES P1-3). */
export const categoryTag = (slug: string) => `category:${slug}`;

/** Liste des catégories (menu de l'en-tête, filtres) ; `null` si l'API ne répond pas. */
export const loadCategories = cache(async (): Promise<Category[] | null> => {
  const res = await serverGet<CategoryDto[]>(ENDPOINTS.categories.list, { revalidate: 300, tags: ["categories"] });
  return res.ok ? res.data.map(toCategory) : null;
});

/** Catégorie côté serveur, une requête par rendu ; `category: null` → chargement navigateur comme avant. */
export const loadCategory = cache(async (slug: string): Promise<{ category: Category | null; notFound: boolean }> => {
  const res = await serverGet<CategoryDto>(ENDPOINTS.categories.detail(slug), { revalidate: 300, tags: [categoryTag(slug)] });
  if (res.ok) return { category: toCategory(res.data), notFound: false };
  return { category: null, notFound: res.status === 404 };
});

export function categoryMetadata(category: Category): Metadata {
  const path = `/categorie/${category.slug}`;
  const title = category.seoTitle || `${category.name} — achat en ligne`;
  const description =
    category.seoDescription ||
    category.description?.trim() ||
    `${category.name} : ${category.productsCount} produits chez ${SITE.name}, livraison rapide et paiement Mobile Money.`;
  const images = category.image ? [category.image] : [];
  return {
    title,
    description,
    alternates: { canonical: path },
    // openGraph remplace celui du layout (pas de fusion) : siteName / locale répétés
    openGraph: { type: "website", siteName: SITE.name, locale: "fr_CD", url: path, title, description, images },
  };
}
