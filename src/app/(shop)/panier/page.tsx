import type { Metadata } from "next";
import { CartView } from "@/modules/cart/components/CartView";

export const metadata: Metadata = { title: "Panier" };

export default function Page() {
  return <CartView />;
}
