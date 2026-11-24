import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { HomeView } from "@/modules/home";
import { homeKeys } from "@/modules/home/keys";
import { HomeJsonLd, loadHome } from "@/modules/home/server";

export const metadata: Metadata = {
  title: "Accueil — mode, maison, beauté et électronique livrés au Kivu",
  description: "Mode, maison et cuisine, beauté, alimentation, bébé, électroménager et téléphones : offres du jour, meilleures ventes et nouveautés chez Celebobo.",
  alternates: { canonical: "/" },
};

/** Accueil rendu côté serveur avec ses produits (SEO), puis repris par React Query. */
export default async function Page() {
  const content = await loadHome();
  const qc = new QueryClient();
  if (content) qc.setQueryData(homeKeys.content, content);
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <HomeJsonLd />
      <HomeView />
    </HydrationBoundary>
  );
}
