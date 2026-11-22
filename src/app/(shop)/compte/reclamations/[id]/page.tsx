import type { Metadata } from "next";
import { MyClaimView } from "@/modules/claims";

export const metadata: Metadata = { title: "Ma réclamation" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MyClaimView id={Number(id)} />;
}
