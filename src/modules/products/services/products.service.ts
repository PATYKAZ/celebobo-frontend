import { ENDPOINTS } from "@/config/endpoints";
import { api, type Paginated, type PageEnvelope } from "@/shared/lib/api";
import type { NewReviewInput, Product, ProductListParams, ProductSuggestion, Review, ReviewEligibility } from "../types";
import {
  toEligibility,
  toProduct,
  toReview,
  toSuggestion,
  type ProductCardDto,
  type ProductDetailDto,
  type ReviewDto,
  type SuggestionDto,
} from "./products.mapper";

interface FacetsDto {
  categories: { value: string; label: string; count: number }[];
  minPrice: string | null;
  maxPrice: string | null;
  inStock: number;
  outOfStock: number;
  onSale: number;
}

/** Compteurs des filtres de la liste (GET /products/facets/). */
export interface ProductFacets {
  /** nombre de produits par slug de catégorie (catégorie directe du produit) */
  categories: Record<string, number>;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: number;
  onSale: number;
}

export const productsService = {
  list(params: ProductListParams = {}): Promise<Paginated<Product>> {
    return api.page<ProductCardDto, Product>(ENDPOINTS.products.list, { params: { ...params } }, toProduct);
  },

  /** Compteurs des filtres pour la recherche en cours (le filtre catégorie n'entre pas dans les comptes par catégorie). */
  async facets(params: ProductListParams = {}): Promise<ProductFacets> {
    const { page: _page, pageSize: _size, ordering: _ordering, ...filters } = params;
    const dto = await api.get<FacetsDto>(ENDPOINTS.products.facets, { params: { ...filters } });
    return {
      categories: Object.fromEntries(dto.categories.map((c) => [c.value, c.count])),
      minPrice: dto.minPrice == null ? null : Number(dto.minPrice),
      maxPrice: dto.maxPrice == null ? null : Number(dto.maxPrice),
      inStock: dto.inStock,
      onSale: dto.onSale,
    };
  },

  async detail(slug: string): Promise<Product> {
    return toProduct(await api.get<ProductDetailDto>(ENDPOINTS.products.detail(slug)));
  },

  async related(slug: string): Promise<Product[]> {
    // l'API renvoie un tableau simple (pas d'enveloppe paginée) ; les deux formes sont acceptées
    const res = await api.get<ProductCardDto[] | PageEnvelope<ProductCardDto>>(ENDPOINTS.products.related(slug));
    return (Array.isArray(res) ? res : res.results).map(toProduct);
  },

  /** Autocomplétion de la barre de recherche. */
  async suggest(q: string): Promise<ProductSuggestion[]> {
    return (await api.get<SuggestionDto[]>(ENDPOINTS.products.suggest, { params: { q } })).map(toSuggestion);
  },

  async reviews(slug: string): Promise<Review[]> {
    const page = await api.get<PageEnvelope<ReviewDto>>(ENDPOINTS.products.reviews(slug), { params: { pageSize: 50 } });
    return page.results.map(toReview);
  },

  async reviewEligibility(slug: string): Promise<ReviewEligibility> {
    return toEligibility(await api.get(ENDPOINTS.products.reviewEligibility(slug)));
  },

  async addReview(slug: string, input: NewReviewInput): Promise<Review> {
    return toReview(await api.post<ReviewDto>(ENDPOINTS.products.reviews(slug), input));
  },
};
