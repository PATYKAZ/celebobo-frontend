import type { Metadata } from "next";
import { OrdersView } from "@/modules/admin/orders";

export const metadata: Metadata = { title: "Commandes & discussions" };

export default function Page() {
  return <OrdersView />;
}
