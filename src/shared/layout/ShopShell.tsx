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
        <main id="contenu" className="mt-3 flex min-w-0 flex-col gap-3 sm:mt-4 sm:gap-4 [&>*]:min-w-0">
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
