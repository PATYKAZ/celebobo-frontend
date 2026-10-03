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

export const productsService = {
  list(params: ProductListParams = {}): Promise<Paginated<Product>> {
    return api.page<ProductCardDto, Product>(ENDPOINTS.products.list, { params: { ...params } }, toProduct);
  },

  async detail(slug: string): Promise<Product> {
    return toProduct(await api.get<ProductDetailDto>(ENDPOINTS.products.detail(slug)));
  },

  async related(slug: string): Promise<Product[]> {
    const page = await api.get<PageEnvelope<ProductCardDto>>(ENDPOINTS.products.related(slug));
    return page.results.map(toProduct);
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
