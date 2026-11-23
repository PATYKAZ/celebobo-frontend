import type { Metadata } from "next";
import { CmsPageView } from "@/modules/pages";

export const metadata: Metadata = { title: "Informations" };

/** Chaque fiche est générée à sa première visite puis servie depuis le cache (régénérée comme la boutique). */
export function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CmsPageView slug={slug} />;
}
