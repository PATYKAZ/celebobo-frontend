import type { Metadata } from "next";
import { env } from "@/config/env";
import { SaleEditView } from "@/modules/admin/sales";
import { DB } from "@/shared/mock-db";

export const metadata: Metadata = { title: "Modifier la vente" };

/** Pré-rendu (mode mock) pour éviter les démarrages à froid ; les ids créés ensuite sont rendus à la demande. */
export const dynamicParams = true;
export function generateStaticParams() {
  return env.USE_MOCKS ? DB.sales.map((s) => ({ id: String(s.id) })) : [];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SaleEditView id={Number(id)} />;
}
