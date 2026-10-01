import { env } from "@/config/env";
import { api, mockResponse } from "@/shared/lib/api";
import { buildMockHomeContent } from "../mocks/content";
import type { HomeContent } from "../types";

export const homeService = {
  /** Contenu éditorial de l'accueil (slides, bannières, marques…). */
  content(): Promise<HomeContent> {
    if (env.USE_MOCKS) return mockResponse(buildMockHomeContent, 120);
    // TODO(api): GET /home/ -> HomeContent (voir modules/home/types.ts)
    return api.get<HomeContent>("/home/");
  },
};
