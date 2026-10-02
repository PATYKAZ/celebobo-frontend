import type { Metadata } from "next";
import { PermissionGuard } from "@/modules/auth";
import { NotificationsView } from "@/modules/messaging";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return (
    <PermissionGuard permission="backoffice.access">
      <NotificationsView embedded />
    </PermissionGuard>
  );
}
