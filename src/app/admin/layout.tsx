import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { AdminShell } from "@/modules/admin/layout/AdminShell";
import { AdminShellSkeleton } from "@/modules/admin/ui/AdminSkeletons";

export const metadata: Metadata = { title: { default: "Back-office", template: "%s | Back-office Celebobo" }, robots: { index: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={["admin", "mukubwa", "revendeur"]} fallback={<AdminShellSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
