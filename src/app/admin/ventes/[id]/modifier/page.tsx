import type { Metadata } from "next";
import { SaleEditView } from "@/modules/admin/sales";

export const metadata: Metadata = { title: "Modifier la vente" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SaleEditView id={Number(id)} />;
}
