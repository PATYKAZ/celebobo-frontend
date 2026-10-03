import type { CmsPage, CmsPageSummary, FaqGroup } from "../types";

/** `GET /pages/` (après camelCase). */
export interface PageSummaryDto {
  id: number;
  slug: string;
  title: string;
  summary: string;
  isPublished: boolean;
  position: number;
  updatedAt: string;
}

export interface PageDto extends PageSummaryDto {
  body: string;
}

export interface FaqGroupDto {
  category: string;
  entries: { id: number; question: string; answer: string; category: string; position: number; isPublished: boolean }[];
}

export const toPageSummary = (dto: PageSummaryDto): CmsPageSummary => ({ slug: dto.slug, title: dto.title, summary: dto.summary, updatedAt: dto.updatedAt });

export const toPage = (dto: PageDto): CmsPage => ({ ...toPageSummary(dto), body: dto.body });

export const toFaqGroup = (dto: FaqGroupDto): FaqGroup => ({
  category: dto.category,
  entries: dto.entries.map((e) => ({ id: e.id, question: e.question, answer: e.answer })),
});
