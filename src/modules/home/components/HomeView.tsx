"use client";

import { CagnotteBanner } from "@/modules/cagnotte/CagnotteBanner";
import { returnPeriod, useSiteSettings } from "@/modules/site";
import { useHomeContent } from "../hooks/useHomeContent";
import { BrandsAndCategories } from "./BrandsAndCategories";
import { CategoryColumns } from "./CategoryColumns";
import { CategoryShowcase } from "./CategoryShowcase";
import { DealsOfTheDay } from "./DealsOfTheDay";
import { HeroSection } from "./HeroSection";
import { ProductTabs } from "./ProductTabs";
import { ProgrammesRow } from "./ProgrammesRow";
import { RecentlyViewed } from "./RecentlyViewed";
import { SeoText } from "./SeoText";

/**
 * Page d'accueil : l'offre et les ventes d'abord, puis les rayons. Pas de section qui répète une autre
 * (livraison déjà dans la barre de recherche, nouveautés déjà dans les onglets).
 */
export function HomeView() {
  const { data: content } = useHomeContent();
  const { returnDays } = useSiteSettings();
  const returnSentence = returnDays > 0 ? ` Vous disposez de ${returnPeriod(returnDays)} après la livraison pour retourner un produit non utilisé.` : "";

  return (
    <>
      {/* titre principal de la page (lecteurs d'écran, moteurs de recherche) ; le visuel commence par le carrousel */}
      <h1 className="sr-only">Celebobo — boutique high-tech : smartphones, ordinateurs, audio et gaming</h1>
      <HeroSection content={content} />
      <CagnotteBanner />
      <DealsOfTheDay content={content} />
      <ProductTabs catalog={content?.catalog ?? null} />
      <BrandsAndCategories brands={content?.brands ?? undefined} />
      {/* blocs catégorie dans l'ordre du back-office (sinon blocs par défaut) */}
      {content?.blocks.map((b) =>
        b.kind === "showcase" ? (
          <CategoryShowcase key={b.key} config={b.showcase} catalog={content.catalog} banner={content.placements?.[`showcase:${b.showcase.categorySlug}`]?.[0]} />
        ) : (
          <CategoryColumns key={b.key} columns={b.columns} catalog={content.catalog} placements={content.placements} />
        ),
      )}
      <ProgrammesRow />
      {/* seulement avec un vrai historique : les meilleures ventes sont déjà plus haut */}
      <RecentlyViewed />
      {content && <SeoText title={content.seo.title} paragraphs={content.seo.paragraphs.map((p) => p.replace("{retour}", returnSentence))} />}
    </>
  );
}
