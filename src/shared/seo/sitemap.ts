import "server-only";
import type { MetadataRoute } from "next";
import { ENDPOINTS } from "@/config/endpoints";
import { siteUrl } from "@/config/site-url";
import { serverGet } from "@/shared/lib/api/server";

/** Étiquette de cache Next du sitemap (revalidation à la demande, cf. BACKEND_CHANGES P1-3). */
export const SITEMAP_TAG = "sitemap";
const REVALIDATE = 3600;
/** Garde-fou : 100 pages × 100 produits (l'API plafonne page_size à 100). */
const MAX_PAGES = 100;

interface Slugged {
  slug: string;
  updatedAt?: string;
}
interface Envelope<T> {
  results: T[];
  next: string | null;
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

async function allProducts(): Promise<Slugged[]> {
  const out: Slugged[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await serverGet<Envelope<Slugged>>(`${ENDPOINTS.products.list}?page=${page}&page_size=100`, { revalidate: REVALIDATE, tags: [SITEMAP_TAG] });
    if (!res.ok) break;
    out.push(...res.data.results);
    if (!res.data.next) break;
  }
  return out;
}

async function list(path: string): Promise<Slugged[]> {
  const res = await serverGet<Slugged[] | Envelope<Slugged>>(path, { revalidate: REVALIDATE, tags: [SITEMAP_TAG] });
  if (!res.ok) return [];
  return Array.isArray(res.data) ? res.data : res.data.results;
}

/**
 * Sitemap construit depuis les listes publiques de l'API. À remplacer par `GET /sitemap/` (dates de mise
 * à jour des produits) quand le backend l'exposera (BACKEND_CHANGES P1-2). API indisponible → pages fixes seules.
 */
export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories, pages] = await Promise.all([allProducts(), list(ENDPOINTS.categories.list), list(ENDPOINTS.site.pages)]);
  const entry = (path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}) => ({ url: `${base}${path}`, ...extra });
  return [
    ...STATIC.map((s) => entry(s.path, { priority: s.priority, changeFrequency: s.changeFrequency })),
    ...categories.map((c) => entry(`/categorie/${c.slug}`, { priority: 0.8, changeFrequency: "daily" as const })),
    ...products.map((p) => entry(`/produits/${p.slug}`, { priority: 0.7, changeFrequency: "weekly" as const, ...(p.updatedAt && { lastModified: p.updatedAt }) })),
    ...pages.map((p) => entry(`/pages/${p.slug}`, { priority: 0.3, changeFrequency: "monthly" as const, ...(p.updatedAt && { lastModified: p.updatedAt }) })),
  ];
}
