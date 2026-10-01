import type { Metadata } from "next";
import { OrderHistoryView } from "@/modules/account";

export const metadata: Metadata = { title: "Mes commandes" };

export default function Page() {
  return <OrderHistoryView />;
}
