"use client";

import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { Block } from "@/shared/ui/Block";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { getPricing } from "@/modules/products/utils";
import type { Category } from "@/modules/categories/types";
import type { CategoryColumn, HomeBanner, HomeCatalog } from "../types";
import { BannerPrice, bannerTone } from "./BannerBits";
import { PhotoBanner } from "./PhotoBanner";

/** Colonne : visuel de la catégorie avec son nombre d'articles, puis ses 4 produits les plus vendus. */
function Column({ category, catalog, banner, index }: { category: Category; catalog: HomeCatalog; banner?: HomeBanner; index: number }) {
  const formatPrice = useFormatPrice();
  // produits fournis par l'accueil ; appel dédié seulement si la catégorie n'y figure pas
  const provided = catalog.byCategory[category.slug];
  const fallback = useProducts({ category: category.slug, ordering: "-sales", pageSize: 4 }, !provided);
  const products = (provided ?? fallback.data?.results)?.filter((p) => p.image).slice(0, 4);
  const href = ROUTES.category(category.slug);
  // bannière de l'admin (`column:<catégorie>`), sinon visuel de la catégorie et son nombre d'articles
  const tone = bannerTone(banner ?? { tone: "dark" }, "from-black/80 via-black/45 to-transparent");

  return (
    <Reveal delay={index * 0.1} className="h-full">
      <Block pad="none" className="h-full min-w-0 overflow-hidden px-4 pb-5 pt-4 sm:px-[30px] sm:pb-8 sm:pt-[30px]">
        <SectionHeader title={category.name} viewAllHref={href} />
        {banner ? (
          <PhotoBanner image={banner.image} href={banner.href} label={banner.title} overlay={tone.overlay} className="mt-4 h-[150px] sm:mt-6 sm:h-[190px]" sizes="(min-width:1280px) 368px, 100vw" contentClassName="flex flex-col justify-center px-[30px]">
            {banner.eyebrow && <p className={cn("text-[10px] uppercase tracking-[0.2em]", tone.muted)}>{banner.eyebrow}</p>}
            <p className={cn("line-clamp-2 whitespace-pre-line text-[14px] font-bold uppercase leading-[22.4px]", tone.text)}>{banner.title}</p>
            {banner.product ? (
              <p className="mt-1"><BannerPrice product={banner.product} className={cn("text-[16px]", tone.price)} strikeClassName={tone.strike} /></p>
            ) : (
              banner.subtitle && <p className={cn("mt-1 line-clamp-2 text-[12px]", tone.muted)}>{banner.subtitle}</p>
            )}
          </PhotoBanner>
        ) : (
          <PhotoBanner image={category.image ?? products?.[0]?.image ?? "/images/hero/hero-2.jpg"} href={href} label={category.name} overlay="from-black/80 via-black/45 to-transparent" className="mt-4 h-[150px] sm:mt-6 sm:h-[190px]" sizes="(min-width:1280px) 368px, 100vw" contentClassName="flex flex-col justify-center px-[30px]">
            <p className="text-[14px] font-bold uppercase leading-[22.4px] text-white">{category.name}</p>
            <p className="mt-1 text-[12px] text-white/80">{category.productsCount} article{category.productsCount > 1 ? "s" : ""}</p>
          </PhotoBanner>
        )}

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line-2/30 pt-5 sm:mt-7 sm:gap-x-6 sm:gap-y-7 sm:pt-7">
          {!products
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="mx-auto size-24 rounded-full sm:size-[120px]" />)
            : products.map((p) => (
                <Link key={p.id} href={ROUTES.product(p.slug)} className="group flex min-w-0 flex-col items-center text-center">
                  <span className="relative block size-24 max-w-full overflow-hidden rounded-full bg-chip ring-2 ring-transparent transition-all duration-500 group-hover:-translate-y-1.5 group-hover:ring-primary sm:size-[120px]">
                    <Image src={p.image as string} alt="" fill sizes="120px" className="object-cover transition-transform duration-700 group-hover:scale-125" />
                  </span>
                  <span className="mt-3 line-clamp-2 text-[14px] font-bold leading-[18px] transition-colors group-hover:text-primary">{p.name}</span>
                  <span className="mt-0.5 text-[12px] font-semibold leading-[18px] text-primary">{formatPrice(getPricing(p).current)}</span>
                </Link>
              ))}
        </div>
      </Block>
    </Reveal>
  );
}

/** Colonnes catégories : seules celles qui existent et ont des produits s'affichent. */
export function CategoryColumns({ columns, catalog, placements }: { columns: CategoryColumn[]; catalog: HomeCatalog | null; placements: Record<string, HomeBanner[]> | null }) {
  const { data: categories } = useCategories();
  const shown = columns.flatMap((c) => categories?.find((x) => x.slug === c.categorySlug && x.productsCount > 0) ?? []);
  if (!catalog || !categories) return null;
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      {shown.map((c, i) => (
        <Column key={c.slug} category={c} catalog={catalog} banner={placements?.[`column:${c.slug}`]?.[0]} index={i} />
      ))}
    </section>
  );
}
