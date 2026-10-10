import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site-url";

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
