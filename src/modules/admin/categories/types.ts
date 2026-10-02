import type { Category } from "@/modules/categories/types";

export type AdminCategory = Category & { order: number; active: boolean };

export interface CategoryFormValues {
  name: string;
  description: string;
  /** Nom d'icône Iconsax (CategoryIcon) */
  icon: string;
  active: boolean;
}

export interface CategoryImageValue {
  /** URL existante ou aperçu local (blob:) */
  url: string | null;
  file?: File | null;
}

/** Icônes sélectionnables (clés de CategoryIcon). */
export const CATEGORY_ICONS = ["Mobile", "Monitor", "Tablet", "Headphone", "Watch", "Game", "Flash", "Camera", "Printer", "Keyboard"] as const;

export const EMPTY_CATEGORY_FORM: CategoryFormValues = { name: "", description: "", icon: "Mobile", active: true };
