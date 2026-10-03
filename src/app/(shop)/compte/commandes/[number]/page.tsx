import type { Metadata } from "next";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { OrderDetailView } from "@/modules/orders/components/OrderDetailView";

export const metadata: Metadata = { title: "Suivi de commande" };

export default async function Page({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return (
    <AuthGuard>
      <OrderDetailView number={number} />
    </AuthGuard>
  );
}
