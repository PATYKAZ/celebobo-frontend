import type { MetadataRoute } from "next";
import { buildSitemap } from "@/shared/seo/sitemap";

/**
 * Rendu à la demande : API_INTERNAL_URL / SITE_URL n'existent qu'à l'exécution (image Docker construite sans eux).
 * Pré-rendu au build, la page resterait figée sans données. Les lectures API restent en cache (fetch).
 */
export const dynamic = "force-dynamic";

/** /sitemap.xml — produits, catégories, pages CMS et pages publiques fixes. */
export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}
