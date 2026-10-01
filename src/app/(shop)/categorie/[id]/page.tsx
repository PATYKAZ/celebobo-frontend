import { CategoryPageView } from "@/modules/categories/components/CategoryPageView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CategoryPageView id={Number(id)} />;
}
