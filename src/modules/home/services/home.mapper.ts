import { money, toProduct, type ProductCardDto, type ProductDetailDto } from "@/modules/products/services/products.mapper";
import type { Product } from "@/modules/products/types";
import { BRANDS, buildHomeContent } from "../content";
import { getPricing } from "@/modules/products/utils";
import type { Brand, HeroSlide, HomeCatalog, HomeContent, HomeDeal, HomePicks } from "../types";

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

/** Offre du jour programmée (après camelCase). `quantity` et `sold` sont null pour une offre sans limite. */
export interface DealDto {
  id: number;
  product: ProductDetailDto;
  /** demandé au backend (BACKEND_CHANGES 4.1 bis) ; sinon retrouvé par le prix */
  variantId?: number | null;
  dealPrice: string;
  regularPrice: string;
  startsAt: string;
  endsAt: string;
  quantity: number | null;
  sold: number | null;
  giftLabel: string;
}

export function toDeal(dto: DealDto): HomeDeal {
  const product = toProduct(dto.product);
  const dealPrice = money(dto.dealPrice);
  // offre sur une variante : c'est la seule à porter le prix de l'offre
  const variant = product.variants.find((v) => (dto.variantId != null ? v.id === dto.variantId : v.price === dealPrice)) ?? null;
  return {
    id: dto.id,
    product,
    variant,
    dealPrice,
    regularPrice: money(dto.regularPrice),
    endsAt: dto.endsAt,
    quantity: dto.quantity,
    sold: dto.sold,
    giftLabel: dto.giftLabel,
  };
}

/** Sans offre programmée : la promotion du catalogue, sans date ni quantité. */
function promotionDeal(product: Product): HomeDeal {
  const pricing = getPricing(product);
  return { id: null, product, variant: null, dealPrice: pricing.current, regularPrice: pricing.original ?? pricing.current, endsAt: null, quantity: null, sold: null, giftLabel: "" };
}

/** `GET /home/` (après camelCase). */
export interface HomeDto {
  banners: BannerDto[];
  deal: DealDto | null;
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

/**
 * Répartit de vrais produits entre les emplacements de l'accueil, sans doublon : l'offre du jour programmée (sinon la
 * promotion la plus vendue) et les mini-bannières parmi les promotions, les cartes promo et latérales parmi les meilleures ventes puis les nouveautés.
 * Un produit sans image ou épuisé n'est pas mis en avant.
 */
export function pickHomeProducts(catalog: HomeCatalog, scheduled: HomeDeal | null = null): HomePicks {
  const used = new Set<number>(scheduled ? [scheduled.product.id] : []);
  const usable = (p: Product) => !!p.image && p.inStock !== false && !used.has(p.id);
  const take = (from: Product[], n: number) => {
    const out = from.filter(usable).slice(0, n);
    out.forEach((p) => used.add(p.id));
    return out;
  };
  const promo = scheduled ? null : (catalog.deals.find((p) => usable(p) && p.images.length >= 2) ?? catalog.deals.find(usable) ?? null);
  if (promo) used.add(promo.id);
  const deal = scheduled ?? (promo && promotionDeal(promo));
  const minis = take(catalog.deals, 2);
  const promos = take(catalog.bestSellers, 2);
  const side = take([...catalog.deals, ...catalog.bestSellers, ...catalog.newArrivals], 3);
  return { deal, minis, promos, side };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Marques dont au moins un produit de l'accueil porte le nom (ou un alias : iPhone → Apple). */
export function brandsInCatalog(catalog: HomeCatalog): Brand[] {
  const names = [...catalog.deals, ...catalog.newArrivals, ...catalog.bestSellers, ...Object.values(catalog.byCategory).flat()].map((p) => p.name);
  return BRANDS.filter((b) => {
    const re = new RegExp(`\\b(${[b.name, ...(b.aliases ?? [])].map(escape).join("|")})\\b`, "i");
    return names.some((n) => re.test(n));
  });
}

/** Contenu complet de l'accueil : éditorial du front + produits et bannières de l'API (service client et rendu serveur). */
export function toHomeContent(dto: HomeDto): HomeContent {
  const content = buildHomeContent();
  const slides = dto.banners.filter((b) => b.image).map(toSlide);
  const catalog = toCatalog(dto);
  return { ...content, catalog, picks: pickHomeProducts(catalog, dto.deal ? toDeal(dto.deal) : null), brands: brandsInCatalog(catalog), slides: slides.length ? slides : content.slides };
}
