import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { HomeContent } from "../types";
import { toHomeContent, type HomeDto } from "./home.mapper";

export const homeService = {
  /**
   * Contenu de l'accueil en un appel : produits (offres, nouveautés, meilleures ventes, par catégorie)
   * et bannières actives du back-office, qui remplacent les slides du design.
   */
  async content(): Promise<HomeContent> {
    return toHomeContent(await api.get<HomeDto>(ENDPOINTS.home));
  },
};
