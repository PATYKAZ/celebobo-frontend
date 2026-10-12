"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { productBanner } from "../services/home.mapper";
import type { HomeBanner, HomeCatalog, ShowcaseConfig } from "../types";
import { BannerPrice, bannerTone } from "./BannerBits";
import { PhotoBanner } from "./PhotoBanner";
import { ProductCarousel } from "./ProductCarousel";

function ShowcaseBanner({ b }: { b: HomeBanner }) {
  const t = bannerTone(b, "from-black/85 via-black/55 to-transparent");
  return (
    <PhotoBanner image={b.image} href={b.href} label={b.title} overlay={t.overlay} className="h-[170px] sm:h-[200px]" sizes="(min-width:1024px) 605px, 100vw" contentClassName="flex flex-col justify-center px-6 sm:px-[30px]">
      {b.eyebrow && <p className={cn("text-[10px] uppercase tracking-[0.2em]", t.muted)}>{b.eyebrow}</p>}
      <h3 className={cn("mt-1 line-clamp-2 max-w-[80%] whitespace-pre-line text-[22px] font-medium uppercase leading-[27px] sm:text-[24px] sm:leading-[28.8px]", t.text)}>{b.title}</h3>
      {b.subtitle && <p className={cn("mt-2 line-clamp-1 max-w-[80%] text-[12px] leading-[20.4px]", t.muted)}>{b.subtitle}</p>}
      <p className="mt-3 flex items-center gap-4">
        {b.product && <BannerPrice product={b.product} className={cn("text-[20px]", t.price)} strikeClassName={t.strike} />}
        <span className="inline-flex h-[33px] w-fit items-center rounded-[8px] bg-primary px-5 text-[11px] font-medium uppercase text-white">{b.cta}</span>
      </p>
    </PhotoBanner>
  );
}

/** Bloc catégorie : bannière de l'admin ou du produit le plus vendu + grille de vraies catégories + carrousel de produits. Réutilisé 2× sur l'accueil. */
export function CategoryShowcase({ config, catalog, banner }: { config: ShowcaseConfig; catalog: HomeCatalog | null; banner?: HomeBanner }) {
  // produits fournis par l'accueil ; appel dédié seulement si la catégorie n'y figure pas
  const provided = catalog?.byCategory[config.categorySlug];
  const fallback = useProducts({ category: config.categorySlug, ordering: "-sales", pageSize: 10 }, !!catalog && !provided);
  const products = provided ?? fallback.data?.results;
  const isLoading = !catalog || (!provided && fallback.isLoading);
  const { data: categories } = useCategories();
  // bannière de l'admin (`showcase:<catégorie>`), sinon le produit le plus vendu de la catégorie
  const top = products?.find((p) => p.image);
  const shown: HomeBanner | null = banner ?? (top ? { ...productBanner(top, "Acheter"), eyebrow: "Le plus demandé", subtitle: top.description } : null);
  const tiles = config.related.flatMap((slug) => categories?.find((c) => c.slug === slug && c.productsCount > 0) ?? []);

  return (
    <Reveal>
      <Block pad="none" className="min-w-0 overflow-hidden px-3 pb-4 pt-4 sm:px-[30px] sm:pb-8 sm:pt-[30px]">
        <SectionHeader title={config.title} viewAllHref={config.viewAllHref} />

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-b border-line-2/25 pb-5 sm:mt-6 sm:gap-6 sm:pb-7 lg:grid-cols-[minmax(0,605px)_minmax(0,1fr)] lg:gap-[46px]">
          {shown ? (
            <ShowcaseBanner b={shown} />
          ) : (
            <Skeleton className="h-[170px] rounded-box sm:h-[200px]" />
          )}

          {!categories ? (
            <Skeleton className="h-[140px] rounded-box" />
          ) : (
            <RevealGroup stagger={0.06} className="grid grid-cols-2 content-center gap-x-3 gap-y-2 sm:gap-x-6 sm:gap-y-4 xl:grid-cols-3">
              {tiles.map((c) => (
                <RevealItem key={c.slug}>
                  <Link href={ROUTES.category(c.slug)} className="group flex min-w-0 items-center justify-between gap-2 rounded-box p-1.5 transition-colors hover:bg-primary-50 active:bg-primary-50 sm:gap-3 sm:p-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-bold leading-[16.8px] transition-colors group-hover:text-primary">{c.name}</span>
                      <span className="mt-1 block text-[12px] leading-[18px] text-ink-2">{c.productsCount} article{c.productsCount > 1 ? "s" : ""}</span>
                    </span>
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-chip sm:size-[50px]">
                      {c.image && <Image src={c.image} alt="" fill sizes="50px" className="object-cover transition-transform duration-500 group-hover:scale-125 group-hover:rotate-3" />}
                    </span>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>

        <div className="mt-4 sm:mt-6">
          <ProductCarousel products={products} loading={isLoading} />
        </div>
      </Block>
    </Reveal>
  );
}
