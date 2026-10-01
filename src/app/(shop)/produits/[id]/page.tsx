import { ProductDetailView } from "@/modules/products/components/ProductDetailView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailView id={Number(id)} />;
}
