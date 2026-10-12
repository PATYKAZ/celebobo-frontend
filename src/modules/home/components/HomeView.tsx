"use client";

import { returnPeriod, useSiteSettings } from "@/modules/site";
import { useHomeContent } from "../hooks/useHomeContent";
import { BrandNew } from "./BrandNew";
import { BrandsAndCategories } from "./BrandsAndCategories";
import { CategoryColumns } from "./CategoryColumns";
import { CategoryShowcase } from "./CategoryShowcase";
import { DealsOfTheDay } from "./DealsOfTheDay";
import { HeroSection } from "./HeroSection";
import { MemberBanner } from "./MemberBanner";
import { ProductTabs } from "./ProductTabs";
import { RecentlyViewed } from "./RecentlyViewed";
import { SeoText } from "./SeoText";

/** Page d'accueil : toutes les sections, dans l'ordre du design (Home 1). */
export function HomeView() {
  const { data: content } = useHomeContent();
  const { returnDays } = useSiteSettings();
  const returnSentence = returnDays > 0 ? ` Vous disposez de ${returnPeriod(returnDays)} après la livraison pour retourner un produit non utilisé.` : "";

  return (
    <>
      {/* titre principal de la page (lecteurs d'écran, moteurs de recherche) ; le visuel commence par le carrousel */}
      <h1 className="sr-only">Celebobo — boutique high-tech : smartphones, ordinateurs, audio et gaming</h1>
      <HeroSection content={content} />
      <BrandsAndCategories brands={content?.brands ?? undefined} />
      <DealsOfTheDay content={content} />
      <MemberBanner />
      <ProductTabs catalog={content?.catalog ?? null} />
      <BrandNew products={content?.catalog?.newArrivals} />
      {/* blocs catégorie dans l'ordre du back-office (sinon blocs par défaut) */}
      {content?.blocks.map((b) =>
        b.kind === "showcase" ? (
          <CategoryShowcase key={b.key} config={b.showcase} catalog={content.catalog} banner={content.placements?.[`showcase:${b.showcase.categorySlug}`]?.[0]} />
        ) : (
          <CategoryColumns key={b.key} columns={b.columns} catalog={content.catalog} placements={content.placements} />
        ),
      )}
      <RecentlyViewed fallback={content?.catalog?.bestSellers} />
      {content && <SeoText title={content.seo.title} paragraphs={content.seo.paragraphs.map((p) => p.replace("{retour}", returnSentence))} />}
    </>
  );
}
