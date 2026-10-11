import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site-url";

/**
 * Rendu à la demande : API_INTERNAL_URL / SITE_URL n'existent qu'à l'exécution (image Docker construite sans eux).
 * Pré-rendu au build, la page resterait figée sans données. Les lectures API restent en cache (fetch).
 */
export const dynamic = "force-dynamic";

/** /robots.txt — espaces privés et parcours d'achat exclus de l'indexation. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/compte", "/panier", "/commande", "/connexion", "/inscription", "/messages", "/notifications", "/favoris", "/recherche", "/assistant", "/reinitialiser-mot-de-passe", "/verifier-email", "/newsletter"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
