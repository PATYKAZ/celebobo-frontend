import type { Metadata } from "next";
import { env } from "@/config/env";
import { OrderDetailView } from "@/modules/admin/orders";
import { MOCK_ORDERS } from "@/modules/orders/mocks/orders";

export const metadata: Metadata = { title: "Détail de la commande" };

/** Pré-rendu (mode démo) ; les ids inconnus sont rendus à la demande. */
export const dynamicParams = true;
export function generateStaticParams() {
  return env.USE_MOCKS ? MOCK_ORDERS.map((o) => ({ id: String(o.id) })) : [];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailView id={Number(id)} />;
}
