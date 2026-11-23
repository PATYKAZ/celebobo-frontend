import type { Metadata } from "next";
import { CashView } from "@/modules/admin/cash/CashView";

export const metadata: Metadata = { title: "Encaissements" };

export default function Page() {
  return <CashView />;
}
