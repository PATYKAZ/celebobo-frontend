import type { Category } from "@/modules/categories/types";

export type AdminCategory = Category & { order: number; active: boolean };

export interface CategoryFormValues {
  name: string;
  description: string;
  /** Nom d'icône de l'API (cf. CategoryIcon) */
  icon: string;
  active: boolean;
}

export interface CategoryImageValue {
  /** URL existante ou aperçu local (blob:) */
  url: string | null;
  file?: File | null;
}

/** Icônes sélectionnables (clés de CategoryIcon). */
export const CATEGORY_ICONS = ["mobile", "monitor", "tablet", "headphone", "watch", "game", "flash", "camera", "printer", "keyboard"] as const;

export const EMPTY_CATEGORY_FORM: CategoryFormValues = { name: "", description: "", icon: "mobile", active: true };
