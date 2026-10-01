import type { Metadata } from "next";
import { ProductCreateView } from "@/modules/admin/products";

export const metadata: Metadata = { title: "Nouveau produit" };

export default function Page() {
  return <ProductCreateView />;
}
