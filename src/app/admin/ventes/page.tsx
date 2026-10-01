import type { Metadata } from "next";
import { SalesListView } from "@/modules/admin/sales";

export const metadata: Metadata = { title: "Ventes" };

export default function Page() {
  return <SalesListView />;
}
