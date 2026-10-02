import type { Metadata } from "next";
import { PermissionGuard } from "@/modules/auth";
import { MessagesView } from "@/modules/messaging";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return (
    <PermissionGuard permission="inbox.view.own">
      <MessagesView embedded />
    </PermissionGuard>
  );
}
