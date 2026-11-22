import type { Metadata } from "next";
import { ResellerApplicationView } from "@/modules/reseller-application/components/ResellerApplicationView";

export const metadata: Metadata = { title: "Devenir revendeur", description: "Rejoignez le réseau de revendeurs Celebobo : commissions jusqu'à 10 % de chaque vente, espace dédié, aucun stock à avancer." };

export default function Page() {
  return <ResellerApplicationView />;
}
