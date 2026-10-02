import { env } from "@/config/env";
import { CategoryPageView } from "@/modules/categories/components/CategoryPageView";
import { MOCK_CATEGORIES } from "@/modules/categories/mocks/categories";

/** Pré-rendu statique (évite les démarrages à froid lors du préchargement des liens). Les ids inconnus sont rendus à la demande. */
export const dynamicParams = true;
export function generateStaticParams() {
  return env.USE_MOCKS ? MOCK_CATEGORIES.map((c) => ({ id: String(c.id) })) : [];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CategoryPageView id={Number(id)} />;
}
