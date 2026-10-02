import type { Metadata } from "next";
import { env } from "@/config/env";
import { PermissionGuard } from "@/modules/auth";
import { MessagesView } from "@/modules/messaging";
import { DB } from "@/shared/mock-db";

export const metadata: Metadata = { title: "Discussion" };

export const dynamicParams = true;
export function generateStaticParams() {
  return env.USE_MOCKS ? DB.orders.map((o) => ({ id: String(o.id) })) : [];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  return (
    <PermissionGuard permission="inbox.view.own">
      <MessagesView embedded initialId={Number.isFinite(n) && n > 0 ? n : null} />
    </PermissionGuard>
  );
}
