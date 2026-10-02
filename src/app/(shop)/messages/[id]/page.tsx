import type { Metadata } from "next";
import { env } from "@/config/env";
import { ROUTES } from "@/config/routes";
import { MessagesView, StaffRedirect } from "@/modules/messaging";
import { DB } from "@/shared/mock-db";

export const metadata: Metadata = { title: "Discussion" };

/** Pré-rendu statique des discussions de démo (évite les démarrages à froid) ; les autres ids sont rendus à la demande. */
export const dynamicParams = true;
export function generateStaticParams() {
  return env.USE_MOCKS ? DB.orders.map((o) => ({ id: String(o.id) })) : [];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  const valid = Number.isFinite(n) && n > 0;
  return (
    <StaffRedirect to={valid ? ROUTES.admin.conversation(n) : ROUTES.admin.inbox}>
      <MessagesView initialId={valid ? n : null} />
    </StaffRedirect>
  );
}
