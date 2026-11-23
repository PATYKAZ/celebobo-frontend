import type { Metadata } from "next";
import { StockAlertsView } from "@/modules/admin/stock/StockAlertsView";

export const metadata: Metadata = { title: "Alertes de stock" };

export default function Page() {
  return <StockAlertsView />;
}
