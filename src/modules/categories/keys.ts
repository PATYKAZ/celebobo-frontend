/** Clés React Query des catégories — module neutre : partagé par les hooks (client) et le rendu serveur. */
export const categoryKeys = {
  all: ["categories"] as const,
  detail: (slug: string) => ["categories", slug] as const,
};
