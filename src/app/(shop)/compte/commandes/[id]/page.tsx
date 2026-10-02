import type { Metadata } from "next";
import { env } from "@/config/env";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { OrderDetailView } from "@/modules/orders/components/OrderDetailView";
import { MOCK_ORDERS } from "@/modules/orders/mocks/orders";

export const metadata: Metadata = { title: "Suivi de commande" };

/** Pré-rendu des ids de démo ; les autres (commandes créées à l'exécution) sont rendus à la demande. */
export const dynamicParams = true;
export function generateStaticParams() {
  return env.USE_MOCKS ? MOCK_ORDERS.map((o) => ({ id: String(o.id) })) : [];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AuthGuard>
      <OrderDetailView id={Number(id)} />
    </AuthGuard>
  );
}
