import { CategoryPageView } from "@/modules/categories/components/CategoryPageView";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoryPageView slug={slug} />;
}
