import type { Metadata } from "next";
import { env } from "@/config/env";
import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import { ProductEditView } from "@/modules/admin/products";

/** Pré-rendu statique des ids de démonstration ; les autres ids sont rendus à la demande. */
export const dynamicParams = true;
export function generateStaticParams() {
  return env.USE_MOCKS ? MOCK_PRODUCTS.map((p) => ({ id: String(p.id) })) : [];
}

export const metadata: Metadata = { title: "Modifier le produit" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditView id={Number(id)} />;
}
