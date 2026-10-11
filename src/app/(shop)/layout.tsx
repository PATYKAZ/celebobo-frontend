import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { categoryKeys } from "@/modules/categories/keys";
import { loadCategories } from "@/modules/categories/server";
import { siteKeys } from "@/modules/site/keys";
import { loadSettings } from "@/modules/site/server";
import { ShopShell } from "@/shared/layout/ShopShell";

/**
 * Pages statiques construites sans API (image Docker) : régénérées en arrière-plan toutes les 5 min, avec
 * les vrais réglages et catégories, dès le premier passage après le déploiement.
 */
export const revalidate = 300;

/** Réglages du site et catégories rendus côté serveur : en-tête, pied de page et menus sont dans le HTML. */
export default async function ShopLayout({ children }: { children: ReactNode }) {
  const [site, categories] = await Promise.all([loadSettings(), loadCategories()]);
  const qc = new QueryClient();
  if (site) qc.setQueryData(siteKeys.settings, site.settings);
  if (categories) qc.setQueryData(categoryKeys.all, categories);
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ShopShell>{children}</ShopShell>
    </HydrationBoundary>
  );
}
