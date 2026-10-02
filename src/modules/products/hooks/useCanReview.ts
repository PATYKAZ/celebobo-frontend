"use client";

import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse } from "@/shared/lib/api";
import { DB } from "@/shared/mock-db";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { Review } from "../types";

/** L'utilisateur a-t-il reçu (statut « livrée ») au moins une commande contenant ce produit ? */
export function hasBoughtProduct(userId: number | undefined, productId: number): boolean {
  if (!userId) return false;
  return DB.orders.some((o) => o.user.id === userId && o.status === "livree" && o.items.some((i) => i.productId === productId));
}

/**
 * Droit de laisser un avis (acheteurs uniquement).
 * Mock : calculé sur `DB.orders`. API : `GET ENDPOINTS.products.testimonies(id)?check=can_review` → `{ canReview: boolean }`
 * (le backend doit aussi refuser le POST d'un non-acheteur : 403).
 */
export function useCanReview(productId: number) {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["products", "can-review", productId, uid],
    enabled: !!uid,
    queryFn: async () => {
      if (env.USE_MOCKS) return mockResponse(() => hasBoughtProduct(uid, productId), 150);
      const res = await api.get<{ canReview: boolean }>(ENDPOINTS.products.testimonies(productId), { params: { check: "can_review" } });
      return res.canReview;
    },
  });
}

/**
 * Avis « achat vérifié » ? API : champ `verified` du témoignage. Mock : vrai si l'auteur a une commande livrée
 * contenant le produit, sinon règle déterministe sur l'id pour illustrer le badge dans les avis de démonstration.
 */
export function isVerifiedReview(review: Review): boolean {
  const flag = (review as Review & { verified?: boolean }).verified;
  if (typeof flag === "boolean") return flag;
  if (!env.USE_MOCKS) return false;
  return hasBoughtProduct(review.user.id, review.productId) || review.id % 3 !== 0;
}
