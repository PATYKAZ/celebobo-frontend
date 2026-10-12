import { ROUTES } from "@/config/routes";
import { money, toProduct, type ProductCardDto, type ProductDetailDto } from "@/modules/products/services/products.mapper";
import type { Product } from "@/modules/products/types";
import { BRANDS, buildHomeContent } from "../content";
import { getPricing } from "@/modules/products/utils";
import type { Brand, HeroSlide, HomeBanner, HomeCatalog, HomeContent, HomeDeal, HomePicks } from "../types";

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
  placement: string;
  productId: number | null;
  product: ProductCardDto | null;
  eyebrow: string;
  tone: "light" | "dark";
}

/** Bannière du back-office ; rattachée à un produit, elle mène à sa fiche et affiche son prix. */
export function toHomeBanner(dto: BannerDto): HomeBanner {
  const product = dto.product ? toProduct(dto.product) : null;
  return {
    key: `b${dto.id}`,
    image: dto.image,
    title: dto.title,
    subtitle: dto.subtitle,
    eyebrow: dto.eyebrow,
    tone: dto.tone,
    href: product ? ROUTES.product(product.slug) : dto.linkUrl || ROUTES.products,
    cta: dto.linkLabel || (product ? "Acheter" : "Découvrir"),
    product,
  };
}

/** Repli quand un emplacement n'a pas de bannière : la carte d'un vrai produit. */
export const productBanner = (p: Product, cta = "Découvrir"): HomeBanner => ({
  key: `p${p.id}`,
  image: p.image as string,
  title: p.name,
  subtitle: "",
  eyebrow: p.category,
  tone: "dark",
  href: ROUTES.product(p.slug),
  cta,
  product: p,
});

export function toSlide(b: HomeBanner, id: number): HeroSlide {
  const dark = b.tone === "dark";
  return {
    id,
    image: b.image,
    tone: b.tone,
    eyebrow: b.eyebrow || undefined,
    titleLines: b.title.split("\n").map((text) => ({ text })),
    text: b.subtitle || undefined,
    cta: { label: b.cta, href: b.href, variant: dark ? "primary" : "dark" },
    overlay: dark ? "from-black/75 via-black/35 to-transparent" : "from-white/90 via-white/60 to-transparent",
    product: b.product,
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
  /** bannières en cours par emplacement : hero, hero_mini, hero_side, deal_side, showcase:<catégorie>, column:<catégorie> */
  banners: Record<string, BannerDto[]>;
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
export function pickHomeProducts(catalog: HomeCatalog, scheduled: HomeDeal | null = null, placements: Record<string, HomeBanner[]> = {}): HomePicks {
  const used = new Set<number>(scheduled ? [scheduled.product.id] : []);
  Object.values(placements).flat().forEach((b) => b.product && used.add(b.product.id));
  const usable = (p: Product) => !!p.image && p.inStock !== false && !used.has(p.id);
  const take = (from: Product[], n: number) => {
    const out = from.filter(usable).slice(0, n);
    out.forEach((p) => used.add(p.id));
    return out;
  };
  const promo = scheduled ? null : (catalog.deals.find((p) => usable(p) && p.images.length >= 2) ?? catalog.deals.find(usable) ?? null);
  if (promo) used.add(promo.id);
  const deal = scheduled ?? (promo && promotionDeal(promo));
  // emplacement rempli dans l'admin : ses bannières ; sinon de vrais produits
  const slot = (name: string, n: number, from: Product[], cta?: string) => placements[name]?.slice(0, n) ?? take(from, n).map((p) => productBanner(p, cta));
  const minis = slot("hero_mini", 2, catalog.deals);
  const promos = slot("hero_side", 2, catalog.bestSellers, "Acheter");
  const side = slot("deal_side", 3, [...catalog.deals, ...catalog.bestSellers, ...catalog.newArrivals]);
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
  // ancien format (liste = carrousel) toléré le temps du déploiement du backend
  const grouped = Array.isArray(dto.banners) ? { hero: dto.banners as BannerDto[] } : (dto.banners ?? {});
  // le client API passe les clés en camelCase (heroSide) : on rend leur nom aux emplacements (les slugs n'ont pas de « _ »)
  const slotName = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  const placements = Object.fromEntries(Object.entries(grouped).map(([key, list]) => [slotName(key), list.filter((b) => b.image).map(toHomeBanner)]));
  const slides = (placements.hero ?? []).map((b, i) => toSlide(b, i + 1));
  const catalog = toCatalog(dto);
  return {
    ...content,
    catalog,
    placements,
    picks: pickHomeProducts(catalog, dto.deal ? toDeal(dto.deal) : null, placements),
    brands: brandsInCatalog(catalog),
    slides: slides.length ? slides : content.slides,
  };
}
