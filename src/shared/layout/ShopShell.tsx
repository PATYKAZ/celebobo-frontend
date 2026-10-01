import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { GreenBar } from "./GreenBar";
import { Header } from "./Header";
import { ScrollTop } from "./ScrollTop";

/**
 * Coquille des pages boutique : container 1330 (zone utile 1300) avec blocs blancs sur fond #E2E4EB.
 * Header (144) + barre verte (75) en haut, footer pleine largeur en bas.
 */
export function ShopShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="container pt-0">
        <Header />
        <GreenBar />
        <main id="contenu" className="mt-4 flex flex-col gap-4">
          {children}
        </main>
      </div>
      <Footer />
      <ScrollTop />
    </>
  );
}
