"use client";

import { useHomeContent } from "../hooks/useHomeContent";
import { BannersRow } from "./BannersRow";
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

  return (
    <>
      {/* titre principal de la page (lecteurs d'écran, moteurs de recherche) ; le visuel commence par le carrousel */}
      <h1 className="sr-only">Celebobo — boutique high-tech : smartphones, ordinateurs, audio et gaming</h1>
      <HeroSection content={content} />
      <BrandsAndCategories brands={content?.brands} />
      <DealsOfTheDay content={content} />
      <MemberBanner />
      <ProductTabs catalog={content?.catalog ?? null} />
      <BrandNew cards={content?.editorial} />
      {content?.showcases.map((s) => (
        <CategoryShowcase key={s.title} config={s} catalog={content.catalog} />
      ))}
      {content && <CategoryColumns columns={content.columns} />}
      <BannersRow />
      <RecentlyViewed fallback={content?.catalog?.bestSellers} />
      {content && <SeoText title={content.seo.title} paragraphs={content.seo.paragraphs} />}
    </>
  );
}
