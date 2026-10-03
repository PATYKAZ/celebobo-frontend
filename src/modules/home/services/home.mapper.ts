import { toProduct, type ProductCardDto } from "@/modules/products/services/products.mapper";
import type { HeroSlide, HomeCatalog } from "../types";

/** Bannière gérée dans le back-office (après camelCase). */
export interface BannerDto {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  linkUrl: string;
  linkLabel: string;
  position: number;
  isActive: boolean;
}

export function toSlide(dto: BannerDto): HeroSlide {
  return {
    id: dto.id,
    image: dto.image,
    tone: "dark",
    titleLines: dto.title.split("\n").map((text) => ({ text })),
    text: dto.subtitle || undefined,
    cta: { label: dto.linkLabel || "Découvrir", href: dto.linkUrl || "/produits", variant: "primary" },
    overlay: "from-black/75 via-black/35 to-transparent",
  };
}

/** `GET /home/` (après camelCase). */
export interface HomeDto {
  banners: BannerDto[];
  deals: ProductCardDto[];
  newArrivals: ProductCardDto[];
  bestSellers: ProductCardDto[];
  categories: { category: { slug: string }; products: ProductCardDto[] }[];
}

export const toCatalog = (dto: HomeDto): HomeCatalog => ({
  deals: dto.deals.map(toProduct),
  newArrivals: dto.newArrivals.map(toProduct),
  bestSellers: dto.bestSellers.map(toProduct),
  byCategory: Object.fromEntries(dto.categories.map((block) => [block.category.slug, block.products.map(toProduct)])),
});
