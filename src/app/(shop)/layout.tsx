import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { categoryKeys } from "@/modules/categories/keys";
import { loadCategories } from "@/modules/categories/server";
import { siteKeys } from "@/modules/site/keys";
import { loadSettings } from "@/modules/site/server";
import { CurrencyProvider } from "@/shared/currency/CurrencyProvider";
import { ShopShell } from "@/shared/layout/ShopShell";

/**
 * Pages boutique statiques, régénérées en arrière-plan au plus toutes les 60 s (et aussitôt qu'une modification
 * du catalogue les invalide : POST /revalidate appelé par Django). L'image Docker est construite sans accès à
 * l'API : une page générée vide au build se remplit dès la première régénération ; le navigateur charge les
 * données entre-temps.
 */
export const revalidate = 60;

/**
 * Réglages du site et catégories rendus côté serveur : en-tête, pied de page et menus sont dans le HTML.
 * Rien ici ne dépend de la requête (pas de cookie lu par le serveur) : la devise est lue par le navigateur.
 */
export default async function ShopLayout({ children }: { children: ReactNode }) {
  const [site, categories] = await Promise.all([loadSettings(), loadCategories()]);
  const qc = new QueryClient();
  if (site) qc.setQueryData(siteKeys.settings, site.settings);
  if (categories) qc.setQueryData(categoryKeys.all, categories);
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CurrencyProvider>
        <ShopShell>{children}</ShopShell>
      </CurrencyProvider>
    </HydrationBoundary>
  );
}
