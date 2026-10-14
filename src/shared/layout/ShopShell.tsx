import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { GreenBar } from "./GreenBar";
import { Header } from "./Header";
import { ScrollTop } from "./ScrollTop";
import { ShopTabBar } from "./ShopTabBar";
import { AssistantLauncher } from "@/modules/assistant/components/AssistantLauncher";

/**
 * Coquille des pages boutique : container 1330 (zone utile 1300) avec blocs blancs sur fond #E2E4EB.
 * Header (144) + barre verte (75) en haut, footer pleine largeur en bas.
 * Mobile : barre d'onglets fixe en bas (+ feuille « Plus ») ; `pb-tabbar` réserve sa hauteur.
 */
export function ShopShell({ children }: { children: ReactNode }) {
  return (
    <div className="pb-tabbar">
      <div className="container pt-0">
        <Header />
        <GreenBar />
        {/* hauteur d’un écran : le pied de page démarre hors de la vue et ne saute pas quand le contenu arrive (CLS) */}
        <main id="contenu" className="mt-3 flex min-h-[calc(var(--dvh)*100)] min-w-0 flex-col gap-3 sm:mt-4 sm:gap-4 *:min-w-0">
          {children}
        </main>
      </div>
      <Footer />
      <ScrollTop />
      <ShopTabBar />
      <AssistantLauncher />
    </div>
  );
}
