import { ProductDetailView } from "@/modules/products/components/ProductDetailView";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailView slug={slug} />;
}
