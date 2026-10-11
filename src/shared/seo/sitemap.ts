import "server-only";
import type { MetadataRoute } from "next";
import { ENDPOINTS } from "@/config/endpoints";
import { siteUrl } from "@/config/site-url";
import { serverGet } from "@/shared/lib/api/server";

/** Étiquette de cache Next du sitemap (revalidation à la demande, cf. BACKEND_CHANGES P1-3). */
export const SITEMAP_TAG = "sitemap";
const REVALIDATE = 3600;

interface Entry {
  slug: string;
  updatedAt: string;
}
/** `GET /sitemap/` : uniquement les produits, catégories et pages visibles en boutique. */
interface SitemapDto {
  products: Entry[];
  categories: Entry[];
  pages: Entry[];
}

/** Pages publiques fixes du front (hors compte, panier, paiement, connexion : non indexables). */
const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/produits", priority: 0.9, changeFrequency: "daily" },
  { path: "/a-propos", priority: 0.4, changeFrequency: "monthly" },
  { path: "/guide", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "monthly" },
  { path: "/devenir-revendeur", priority: 0.5, changeFrequency: "monthly" },
  { path: "/suivi", priority: 0.3, changeFrequency: "yearly" },
];

/** Sitemap depuis `GET /sitemap/` (une requête, dates de mise à jour). API indisponible → pages fixes seules. */
export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const res = await serverGet<SitemapDto>(ENDPOINTS.sitemap, { revalidate: REVALIDATE, tags: [SITEMAP_TAG] });
  const { products, categories, pages } = res.ok ? res.data : { products: [], categories: [], pages: [] };
  const entry = (path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}) => ({ url: `${base}${path}`, ...extra });
  return [
    ...STATIC.map((s) => entry(s.path, { priority: s.priority, changeFrequency: s.changeFrequency })),
    ...categories.map((c) => entry(`/categorie/${c.slug}`, { priority: 0.8, changeFrequency: "daily" as const, lastModified: c.updatedAt })),
    ...products.map((p) => entry(`/produits/${p.slug}`, { priority: 0.7, changeFrequency: "weekly" as const, lastModified: p.updatedAt })),
    ...pages.map((p) => entry(`/pages/${p.slug}`, { priority: 0.3, changeFrequency: "monthly" as const, lastModified: p.updatedAt })),
  ];
}
