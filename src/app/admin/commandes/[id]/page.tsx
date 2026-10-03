import type { Metadata } from "next";
import { OrderDetailView } from "@/modules/admin/orders";

export const metadata: Metadata = { title: "Détail de la commande" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailView id={Number(id)} />;
}
