import { env } from "@/config/env";
import { ProductDetailView } from "@/modules/products/components/ProductDetailView";
import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";

/** Pré-rendu statique (évite les démarrages à froid lors du préchargement des liens). Les ids inconnus sont rendus à la demande. */
export const dynamicParams = true;
export function generateStaticParams() {
  return env.USE_MOCKS ? MOCK_PRODUCTS.map((p) => ({ id: String(p.id) })) : [];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailView id={Number(id)} />;
}
