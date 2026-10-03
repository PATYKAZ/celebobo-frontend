import type { Metadata } from "next";
import { ProductAdminDetailView } from "@/modules/admin/products";

export const metadata: Metadata = { title: "Détail produit" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductAdminDetailView id={Number(id)} />;
}
