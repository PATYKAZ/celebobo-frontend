import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { CmsPage, CmsPageSummary, FaqGroup } from "../types";
import { toFaqGroup, toPage, toPageSummary, type FaqGroupDto, type PageDto, type PageSummaryDto } from "./pages.mapper";

export const pagesService = {
  async list(): Promise<CmsPageSummary[]> {
    return (await api.get<PageSummaryDto[]>(ENDPOINTS.site.pages)).map(toPageSummary);
  },

  async get(slug: string): Promise<CmsPage> {
    return toPage(await api.get<PageDto>(ENDPOINTS.site.page(slug)));
  },

  async faq(): Promise<FaqGroup[]> {
    return (await api.get<FaqGroupDto[]>(ENDPOINTS.site.faq)).map(toFaqGroup);
  },
};
