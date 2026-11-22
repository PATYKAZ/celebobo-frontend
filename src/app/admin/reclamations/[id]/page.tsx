import type { Metadata } from "next";
import { AdminClaimDetailView } from "@/modules/claims";

export const metadata: Metadata = { title: "Détail de la réclamation" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminClaimDetailView id={Number(id)} />;
}
