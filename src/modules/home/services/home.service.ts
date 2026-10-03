import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { buildHomeContent } from "../content";
import type { HomeContent } from "../types";
import { toCatalog, toSlide, type HomeDto } from "./home.mapper";

export const homeService = {
  /**
   * Contenu de l'accueil en un appel : produits (offres, nouveautés, meilleures ventes, par catégorie)
   * et bannières actives du back-office, qui remplacent les slides du design.
   */
  async content(): Promise<HomeContent> {
    const content = buildHomeContent();
    const dto = await api.get<HomeDto>(ENDPOINTS.home);
    const slides = dto.banners.filter((b) => b.image).map(toSlide);
    return { ...content, catalog: toCatalog(dto), slides: slides.length ? slides : content.slides };
  },
};
