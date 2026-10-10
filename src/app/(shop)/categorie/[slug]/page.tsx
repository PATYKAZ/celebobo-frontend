import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { CategoryPageView } from "@/modules/categories/components/CategoryPageView";
import { categoryKeys } from "@/modules/categories/keys";
import { categoryMetadata, loadCategory } from "@/modules/categories/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await loadCategory((await params).slug);
  return category ? categoryMetadata(category) : { title: "Catégorie" };
}

/** En-tête de catégorie rendu côté serveur (SEO) ; la liste filtrable se charge dans le navigateur. */
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { category, notFound: missing } = await loadCategory(slug);
  if (missing) notFound();
  const qc = new QueryClient();
  if (category) qc.setQueryData(categoryKeys.detail(slug), category);
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CategoryPageView slug={slug} />
    </HydrationBoundary>
  );
}
