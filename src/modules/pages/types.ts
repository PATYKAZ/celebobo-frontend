import { ROUTES } from "@/config/routes";

/** Page de contenu éditée dans le back-office (`GET /pages/{slug}/`). Corps en Markdown. */
export interface CmsPage {
  slug: string;
  title: string;
  summary: string;
  body: string;
  updatedAt: string;
}

export type CmsPageSummary = Omit<CmsPage, "body">;

export interface FaqEntry {
  id: number;
  question: string;
  answer: string;
}

export interface FaqGroup {
  category: string;
  entries: FaqEntry[];
}

/** Pages servies par la route générique `/pages/[slug]` (les autres ont leur propre mise en page). */
export const DEDICATED_PAGES: Record<string, string> = { "a-propos": ROUTES.about, guide: ROUTES.guide };
