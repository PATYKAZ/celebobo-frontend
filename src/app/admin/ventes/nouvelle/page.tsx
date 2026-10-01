import type { Metadata } from "next";
import { SaleCreateView } from "@/modules/admin/sales";

export const metadata: Metadata = { title: "Nouvelle vente" };

export default function Page() {
  return <SaleCreateView />;
}
