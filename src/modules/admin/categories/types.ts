import type { Category } from "@/modules/categories/types";

export type AdminCategory = Category & { order: number; active: boolean; /** catégorie parente, null = principale */ parentId: number | null };

export interface CategoryFormValues {
  name: string;
  description: string;
  /** Nom d'icône de l'API (cf. CategoryIcon) */
  icon: string;
  active: boolean;
  /** catégorie parente (sous-catégorie) ; null = catégorie principale */
  parentId: number | null;
  seoTitle: string;
  seoDescription: string;
}

export interface CategoryImageValue {
  /** URL existante ou aperçu local (blob:) */
  url: string | null;
  file?: File | null;
}

/** Icônes sélectionnables (clés de CategoryIcon). */
export const CATEGORY_ICONS = ["mobile", "monitor", "tablet", "headphone", "watch", "game", "flash", "camera", "printer", "keyboard"] as const;

export const EMPTY_CATEGORY_FORM: CategoryFormValues = { name: "", description: "", icon: "mobile", active: true, parentId: null, seoTitle: "", seoDescription: "" };

/**
 * Lignes de l'admin (liste à plat avec `parentId`) → ordre d'affichage : chaque catégorie principale suivie de ses
 * sous-catégories, chacune avec `parent` renseigné.
 */
export function categoryTree(rows: AdminCategory[]): AdminCategory[] {
  const byOrder = (a: AdminCategory, b: AdminCategory) => a.order - b.order || a.id - b.id;
  const tops = rows.filter((c) => c.parentId == null || !rows.some((p) => p.id === c.parentId)).sort(byOrder);
  return tops.flatMap((top) => [
    top,
    ...rows
      .filter((c) => c.parentId === top.id)
      .sort(byOrder)
      .map((c) => ({ ...c, parent: { id: top.id, slug: top.slug, name: top.name } })),
  ]);
}
