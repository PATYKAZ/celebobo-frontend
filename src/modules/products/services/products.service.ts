import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse, paginate, type Paginated } from "@/shared/lib/api";
import { MOCK_PRODUCTS } from "../mocks/products";
import { mockReviewsFor } from "../mocks/reviews";
import type { NewReviewInput, Product, ProductListParams, Review } from "../types";
import { getPricing } from "../utils";

/** En mémoire (mock) — avis ajoutés pendant la session. */
const sessionReviews: Review[] = [];

function filterMocks(p: ProductListParams): Product[] {
  let list = [...MOCK_PRODUCTS];
  if (p.ids?.length) list = list.filter((x) => p.ids!.includes(x.id));
  if (p.category) list = list.filter((x) => x.categoryId === p.category);
  if (p.search) {
    const q = p.search.toLowerCase();
    list = list.filter((x) => `${x.name} ${x.description} ${x.category}`.toLowerCase().includes(q));
  }
  if (p.onSale) list = list.filter((x) => getPricing(x).onSale);
  if (p.inStock) list = list.filter((x) => x.inStock);
  if (p.badge === "new") list = list.filter((x) => x.currentBadge === "Nouveauté");
  if (p.minPrice != null) list = list.filter((x) => getPricing(x).current >= p.minPrice!);
  if (p.maxPrice != null) list = list.filter((x) => getPricing(x).current <= p.maxPrice!);

  const key = (x: Product) => getPricing(x).current;
  switch (p.ordering) {
    case "price":
      list.sort((a, b) => key(a) - key(b));
      break;
    case "-price":
      list.sort((a, b) => key(b) - key(a));
      break;
    case "-sales":
      list.sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0));
      break;
    case "-rating":
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "name":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "date_added":
      list.sort((a, b) => +new Date(a.dateAdded) - +new Date(b.dateAdded));
      break;
    default:
      list.sort((a, b) => +new Date(b.dateAdded) - +new Date(a.dateAdded));
  }
  return list;
}

export const productsService = {
  list(params: ProductListParams = {}): Promise<Paginated<Product>> {
    if (env.USE_MOCKS) {
      return mockResponse(() => paginate(filterMocks(params), params.page ?? 1, params.pageSize ?? 12));
    }
    return api.get<Paginated<Product>>(ENDPOINTS.products.list, { params: params as never });
  },

  async detail(id: number): Promise<Product> {
    if (env.USE_MOCKS) {
      const found = MOCK_PRODUCTS.find((p) => p.id === id);
      if (!found) throw new ApiError(404, "Produit introuvable");
      return mockResponse(found);
    }
    return api.get<Product>(ENDPOINTS.products.detail(id));
  },

  related(id: number): Promise<Product[]> {
    if (env.USE_MOCKS) {
      const base = MOCK_PRODUCTS.find((p) => p.id === id);
      return mockResponse(() =>
        MOCK_PRODUCTS.filter((p) => p.id !== id && p.categoryId === base?.categoryId)
          .concat(MOCK_PRODUCTS.filter((p) => p.id !== id && p.categoryId !== base?.categoryId))
          .slice(0, 8),
      );
    }
    return api.get<Product[]>(ENDPOINTS.products.related(id));
  },

  /** Autocomplétion de la barre de recherche. */
  suggest(q: string): Promise<Pick<Product, "id" | "name" | "image" | "price" | "priceSolde" | "category">[]> {
    if (env.USE_MOCKS) {
      return mockResponse(() => filterMocks({ search: q }).slice(0, 6), 150);
    }
    return api.get(ENDPOINTS.products.suggest, { params: { q } });
  },

  reviews(productId: number): Promise<Review[]> {
    if (env.USE_MOCKS) {
      return mockResponse(() => [...sessionReviews.filter((r) => r.productId === productId), ...mockReviewsFor(productId)]);
    }
    return api.get<Review[]>(ENDPOINTS.products.testimonies(productId));
  },

  async addReview(productId: number, input: NewReviewInput, author?: { id: number; name: string; avatar: string | null }): Promise<Review> {
    if (env.USE_MOCKS) {
      const review: Review = {
        id: Date.now(),
        productId,
        user: author ?? { id: 0, name: "Vous", avatar: null },
        rating: input.rating,
        message: input.message,
        dateCreated: new Date().toISOString(),
      };
      sessionReviews.unshift(review);
      return mockResponse(review, 300);
    }
    return api.post<Review>(ENDPOINTS.products.testimonies(productId), input);
  },
};
