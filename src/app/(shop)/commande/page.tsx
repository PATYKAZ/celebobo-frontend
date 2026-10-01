import type { Metadata } from "next";
import { CheckoutView } from "@/modules/checkout";

export const metadata: Metadata = { title: "Commande" };

export default function Page() {
  return <CheckoutView />;
}
