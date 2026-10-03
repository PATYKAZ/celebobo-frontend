"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { useProducts } from "@/modules/products/hooks/useProducts";
import type { HomeCatalog, ShowcaseConfig } from "../types";
import { PhotoBanner } from "./PhotoBanner";
import { ProductCarousel } from "./ProductCarousel";

/** Bloc catégorie : bannière + grille 3×2 de sous-catégories + carrousel de produits. Réutilisé 2× sur l'accueil. */
export function CategoryShowcase({ config, catalog }: { config: ShowcaseConfig; catalog: HomeCatalog | null }) {
  // produits fournis par l'accueil ; appel dédié seulement si la catégorie n'y figure pas
  const provided = catalog?.byCategory[config.categorySlug];
  const fallback = useProducts({ category: config.categorySlug, ordering: "-sales", pageSize: 10 }, !!catalog && !provided);
  const products = provided ?? fallback.data?.results;
  const isLoading = !catalog || (!provided && fallback.isLoading);
  const { banner } = config;
  const dark = banner.tone === "dark";

  return (
    <Reveal>
      <Block pad="none" className="min-w-0 overflow-hidden px-3 pb-4 pt-4 sm:px-[30px] sm:pb-8 sm:pt-[30px]">
        <SectionHeader title={config.title} viewAllHref={config.viewAllHref} />

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 border-b border-line-2/25 pb-5 sm:mt-6 sm:gap-6 sm:pb-7 lg:grid-cols-[minmax(0,605px)_minmax(0,1fr)] lg:gap-[46px]">
          <PhotoBanner image={banner.image} href={config.viewAllHref} label={banner.title.join(" ")} overlay={banner.overlay} className="h-[170px] sm:h-[200px]" sizes="(min-width:1024px) 605px, 100vw" contentClassName="flex flex-col justify-center px-6 sm:px-[30px]">
            <h3 className={cn("text-[22px] font-medium uppercase leading-[27px] sm:text-[24px] sm:leading-[28.8px]", dark ? "text-white" : "text-ink")}>
              {banner.title.map((l) => (
                <span key={l} className="block">{l}</span>
              ))}
            </h3>
            <p className={cn("mt-3 text-[12px] leading-[20.4px]", dark ? "text-white/80" : "text-ink-2")}>{banner.text}</p>
            <span className={cn("mt-4 inline-flex h-[33px] w-fit items-center rounded-[8px] px-5 text-[11px] font-medium uppercase text-white transition-colors", dark ? "bg-primary" : "bg-ink-dark")}>{banner.cta}</span>
          </PhotoBanner>

          <RevealGroup stagger={0.06} className="grid grid-cols-2 content-center gap-x-3 gap-y-2 sm:gap-x-6 sm:gap-y-4 xl:grid-cols-3">
            {config.subCategories.map((s) => (
              <RevealItem key={s.name}>
                <Link href={s.href} className="group flex min-w-0 items-center justify-between gap-2 rounded-box p-1.5 transition-colors hover:bg-primary-50 active:bg-primary-50 sm:gap-3 sm:p-2">
                  <span>
                    <span className="block text-[14px] font-bold leading-[16.8px] transition-colors group-hover:text-primary">{s.name}</span>
                    <span className="mt-1 block text-[12px] leading-[18px] text-ink-2">{s.count} article{s.count > 1 ? "s" : ""}</span>
                  </span>
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-chip sm:size-[50px]">
                    <Image src={s.image} alt="" fill sizes="50px" className="object-cover transition-transform duration-500 group-hover:scale-125 group-hover:rotate-3" />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <div className="mt-4 sm:mt-6">
          <ProductCarousel products={products} loading={isLoading} />
        </div>
      </Block>
    </Reveal>
  );
}
