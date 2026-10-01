"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { useProducts } from "@/modules/products/hooks/useProducts";
import type { ShowcaseConfig } from "../types";
import { PhotoBanner } from "./PhotoBanner";
import { ProductCarousel } from "./ProductCarousel";

/** Bloc catégorie : bannière + grille 3×2 de sous-catégories + carrousel de produits. Réutilisé 2× sur l'accueil. */
export function CategoryShowcase({ config }: { config: ShowcaseConfig }) {
  const { data, isLoading } = useProducts({ category: config.categoryId, ordering: "-sales", pageSize: 10 });
  const { banner } = config;
  const dark = banner.tone === "dark";

  return (
    <Reveal>
      <Block pad="none" className="px-4 pb-8 pt-[30px] sm:px-[30px]">
        <SectionHeader title={config.title} viewAllHref={config.viewAllHref} />

        <div className="mt-6 grid gap-6 border-b border-line-2/25 pb-7 lg:grid-cols-[minmax(0,605px)_minmax(0,1fr)] lg:gap-[46px]">
          <PhotoBanner image={banner.image} href={config.viewAllHref} label={banner.title.join(" ")} overlay={banner.overlay} className="h-[200px]" sizes="605px" contentClassName="flex flex-col justify-center px-6 sm:px-[30px]">
            <h3 className={cn("text-[22px] font-medium uppercase leading-[27px] sm:text-[24px] sm:leading-[28.8px]", dark ? "text-white" : "text-ink")}>
              {banner.title.map((l) => (
                <span key={l} className="block">{l}</span>
              ))}
            </h3>
            <p className={cn("mt-3 text-[12px] leading-[20.4px]", dark ? "text-white/80" : "text-ink-2")}>{banner.text}</p>
            <span className={cn("mt-4 inline-flex h-[33px] w-fit items-center rounded-[8px] px-5 text-[11px] font-medium uppercase text-white transition-colors", dark ? "bg-primary" : "bg-ink-dark")}>{banner.cta}</span>
          </PhotoBanner>

          <RevealGroup stagger={0.06} className="grid grid-cols-1 content-center gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            {config.subCategories.map((s) => (
              <RevealItem key={s.name}>
                <Link href={s.href} className="group flex items-center justify-between gap-3 rounded-box p-2 transition-colors hover:bg-primary-50">
                  <span>
                    <span className="block text-[14px] font-bold leading-[16.8px] transition-colors group-hover:text-primary">{s.name}</span>
                    <span className="mt-1 block text-[12px] leading-[18px] text-ink-2">{s.count} articles</span>
                  </span>
                  <span className="relative size-[50px] shrink-0 overflow-hidden rounded-md bg-chip">
                    <Image src={s.image} alt="" fill sizes="50px" className="object-cover transition-transform duration-500 group-hover:scale-125 group-hover:rotate-3" />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <div className="mt-6">
          <ProductCarousel products={data?.results} loading={isLoading} />
        </div>
      </Block>
    </Reveal>
  );
}
