import type { Metadata } from "next";
import { ProductsListView } from "@/modules/admin/products";

export const metadata: Metadata = { title: "Produits" };

export default function Page() {
  return <ProductsListView />;
}
