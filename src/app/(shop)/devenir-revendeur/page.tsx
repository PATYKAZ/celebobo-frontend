import type { Metadata } from "next";
import { ResellerApplicationView } from "@/modules/reseller-application/components/ResellerApplicationView";

export const metadata: Metadata = { title: "Devenir revendeur", description: "Rejoignez le réseau de revendeurs Celebobo : commissions de 5 à 10 %, espace dédié, aucun stock à avancer." };

export default function Page() {
  return <ResellerApplicationView />;
}
