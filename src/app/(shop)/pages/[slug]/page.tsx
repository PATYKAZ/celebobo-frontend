import type { Metadata } from "next";
import { CmsPageView } from "@/modules/pages";

export const metadata: Metadata = { title: "Informations" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CmsPageView slug={slug} />;
}
