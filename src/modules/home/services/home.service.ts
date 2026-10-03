import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import { buildHomeContent } from "../content";
import type { HomeContent } from "../types";
import { toSlide, type BannerDto } from "./home.mapper";

export const homeService = {
  /** Contenu éditorial de l'accueil ; les bannières actives du back-office (avec image) remplacent les slides. */
  async content(): Promise<HomeContent> {
    const content = buildHomeContent();
    const { banners } = await api.get<{ banners: BannerDto[] }>(ENDPOINTS.home);
    const slides = banners.filter((b) => b.image).map(toSlide);
    return slides.length ? { ...content, slides } : content;
  },
};
