import type { Metadata } from "next";
import { PermissionGuard } from "@/modules/auth";
import { MessagesView } from "@/modules/messaging";

export const metadata: Metadata = { title: "Discussion" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  return (
    <PermissionGuard permission="inbox.view.own">
      <MessagesView embedded initialId={Number.isFinite(n) && n > 0 ? n : null} />
    </PermissionGuard>
  );
}
