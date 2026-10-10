import "server-only";
import { cache } from "react";
import { ENDPOINTS } from "@/config/endpoints";
import { ROUTES } from "@/config/routes";
import { SITE } from "@/config/site";
import { siteUrl } from "@/config/site-url";
import { serverGet } from "@/shared/lib/api/server";
import { toHomeContent, type HomeDto } from "./services/home.mapper";
import type { HomeContent } from "./types";

/** Étiquette de cache Next de l'accueil (revalidation à la demande, cf. BACKEND_CHANGES P1-3). */
export const HOME_TAG = "home";

/** Accueil côté serveur ; `null` → contenu éditorial immédiat puis produits chargés par le navigateur, comme avant. */
export const loadHome = cache(async (): Promise<HomeContent | null> => {
  const res = await serverGet<HomeDto>(ENDPOINTS.home, { revalidate: 60, tags: [HOME_TAG] });
  return res.ok ? toHomeContent(res.data) : null;
});

/** Données structurées du site : organisation + champ de recherche dans les résultats Google. */
export function HomeJsonLd() {
  const url = siteUrl();
  const data = [
    { "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url, logo: `${url}/apple-icon.png`, email: SITE.email, telephone: SITE.hotline },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url,
      inLanguage: "fr",
      potentialAction: { "@type": "SearchAction", target: `${url}${ROUTES.search("{search_term_string}").replace(encodeURIComponent("{search_term_string}"), "{search_term_string}")}`, "query-input": "required name=search_term_string" },
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
