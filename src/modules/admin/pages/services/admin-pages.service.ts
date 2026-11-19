import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";

/** Page du back-office (`/bo/pages/`, après camelCase) : contenu en Markdown. */
export interface AdminPage {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string;
  isPublished: boolean;
  position: number;
  /** Politiques : version et date d'entrée en vigueur (vides pour une page simple) */
  version: string;
  effectiveOn: string | null;
  updatedAt: string;
}

export interface PageFormValues {
  slug: string;
  title: string;
  summary: string;
  body: string;
  isPublished: boolean;
  position: string;
  version: string;
  effectiveOn: string;
}

export const EMPTY_PAGE: PageFormValues = { slug: "", title: "", summary: "", body: "", isPublished: true, position: "0", version: "", effectiveOn: "" };

export const pageToForm = (p: AdminPage): PageFormValues => ({
  slug: p.slug,
  title: p.title,
  summary: p.summary,
  body: p.body,
  isPublished: p.isPublished,
  position: String(p.position),
  version: p.version,
  effectiveOn: p.effectiveOn ?? "",
});

const toPayload = (v: PageFormValues) => ({
  slug: v.slug.trim(),
  title: v.title.trim(),
  summary: v.summary.trim(),
  body: v.body.trim(),
  isPublished: v.isPublished,
  position: Number(v.position) || 0,
  version: v.version.trim(),
  effectiveOn: v.effectiveOn || null,
});

const { pages } = ENDPOINTS.admin;

export const adminPagesService = {
  async list(): Promise<AdminPage[]> {
    return api.get<AdminPage[]>(pages.list);
  },
  async create(v: PageFormValues): Promise<AdminPage> {
    return api.post<AdminPage>(pages.list, toPayload(v));
  },
  async update(id: number, v: PageFormValues): Promise<AdminPage> {
    return api.patch<AdminPage>(pages.detail(id), toPayload(v));
  },
  async setPublished(id: number, isPublished: boolean): Promise<AdminPage> {
    return api.patch<AdminPage>(pages.detail(id), { isPublished });
  },
  async remove(id: number): Promise<void> {
    await api.delete(pages.detail(id));
  },
};
