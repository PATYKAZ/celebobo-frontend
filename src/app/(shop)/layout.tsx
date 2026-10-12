import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { categoryKeys } from "@/modules/categories/keys";
import { loadCategories } from "@/modules/categories/server";
import { siteKeys } from "@/modules/site/keys";
import { loadSettings } from "@/modules/site/server";
import { CURRENCY_COOKIE, parseCurrency } from "@/shared/currency/currency";
import { CurrencyProvider } from "@/shared/currency/CurrencyProvider";
import { ShopShell } from "@/shared/layout/ShopShell";


/**
 * Réglages du site et catégories rendus côté serveur : en-tête, pied de page et menus sont dans le HTML.
 * Le cookie de devise (USD / FC) est lu ici : les prix arrivent dans la devise choisie, sans clignotement.
 * Lire un cookie rend les pages boutique dynamiques ; les lectures API restent en cache (fetch).
 */
export default async function ShopLayout({ children }: { children: ReactNode }) {
  const [site, categories, jar] = await Promise.all([loadSettings(), loadCategories(), cookies()]);
  const qc = new QueryClient();
  if (site) qc.setQueryData(siteKeys.settings, site.settings);
  if (categories) qc.setQueryData(categoryKeys.all, categories);
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CurrencyProvider initial={parseCurrency(jar.get(CURRENCY_COOKIE)?.value)}>
        <ShopShell>{children}</ShopShell>
      </CurrencyProvider>
    </HydrationBoundary>
  );
}
