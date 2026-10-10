import type { MetadataRoute } from "next";
import { buildSitemap } from "@/shared/seo/sitemap";

/** /sitemap.xml — produits, catégories, pages CMS et pages publiques fixes. */
export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}
