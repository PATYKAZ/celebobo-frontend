import type { ProductListParams } from "./types";

/** Clés React Query des produits — module neutre : partagé par les hooks (client) et le rendu serveur. */
export const productKeys = {
  all: ["products"] as const,
  list: (p: ProductListParams) => ["products", "list", p] as const,
  detail: (slug: string) => ["products", "detail", slug] as const,
  related: (slug: string) => ["products", "related", slug] as const,
  suggest: (q: string) => ["products", "suggest", q] as const,
  reviews: (slug: string) => ["products", "reviews", slug] as const,
  eligibility: (slug: string, userId?: number) => ["products", "can-review", slug, userId] as const,
};
