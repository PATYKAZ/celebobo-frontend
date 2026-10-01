import type { Metadata } from "next";
import { ProductsPageView } from "@/modules/products/components/ProductsPageView";

export const metadata: Metadata = { title: "Tous les produits" };

export default function Page() {
  return <ProductsPageView />;
}
