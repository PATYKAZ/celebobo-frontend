import type { Metadata } from "next";
import { HomeView } from "@/modules/home";

export const metadata: Metadata = {
  title: "Accueil — la boutique high-tech de confiance",
  description: "Smartphones, ordinateurs, audio, gaming et accessoires : offres du jour, meilleures ventes et nouveautés chez Celebobo.",
};

export default function Page() {
  return <HomeView />;
}
