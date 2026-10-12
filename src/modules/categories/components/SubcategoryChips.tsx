"use client";

import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { useCategories } from "../hooks/useCategories";
import type { Category } from "../types";

/**
 * Sous-catégories d'une catégorie principale, ou sœurs d'une sous-catégorie : « Tout » (le parent, qui inclut ses
 * sous-catégories) puis chaque sous-catégorie qui a des articles. Rien si la catégorie n'en a pas.
 */
export function SubcategoryChips({ category }: { category: Category }) {
  const { data: tree } = useCategories();
  const parent = category.parent ? tree?.find((c) => c.id === category.parent?.id) : (tree?.find((c) => c.id === category.id) ?? category);
  const children = (parent?.children ?? []).filter((c) => c.productsCount > 0 || c.id === category.id);
  if (!parent || !children.length) return null;

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-pill border px-4 text-[13px] font-semibold transition-colors sm:h-9",
      active ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink hover:border-primary hover:text-primary",
    );
  return (
    <nav aria-label={`Sous-catégories de ${parent.name}`} className="no-scrollbar -mx-[15px] flex gap-2 overflow-x-auto px-[15px] sm:mx-0 sm:flex-wrap sm:px-0">
      <Link href={ROUTES.category(parent.slug)} aria-current={parent.id === category.id ? "page" : undefined} className={chip(parent.id === category.id)}>
        Tout {parent.name}
        <span className="text-[11px] opacity-70">{parent.productsCount}</span>
      </Link>
      {children.map((c) => (
        <Link key={c.id} href={ROUTES.category(c.slug)} aria-current={c.id === category.id ? "page" : undefined} className={chip(c.id === category.id)}>
          {c.name}
          <span className="text-[11px] opacity-70">{c.productsCount}</span>
        </Link>
      ))}
    </nav>
  );
}
