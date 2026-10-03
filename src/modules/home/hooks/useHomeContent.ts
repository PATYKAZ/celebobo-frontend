"use client";

import { useQuery } from "@tanstack/react-query";
import { buildHomeContent } from "../content";
import { homeService } from "../services/home.service";

/** Le contenu éditorial s'affiche tout de suite (placeholder) ; les produits arrivent avec la réponse de l'API. */
export function useHomeContent() {
  return useQuery({ queryKey: ["home", "content"], queryFn: homeService.content, staleTime: 5 * 60_000, placeholderData: buildHomeContent });
}
