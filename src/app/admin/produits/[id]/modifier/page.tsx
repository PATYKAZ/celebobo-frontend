import type { Metadata } from "next";
import { ProductEditView } from "@/modules/admin/products";

export const metadata: Metadata = { title: "Modifier le produit" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditView id={Number(id)} />;
}
