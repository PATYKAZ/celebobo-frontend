import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageSkeleton } from "@/modules/admin/ui/AdminSkeletons";
import { CommissionsView } from "@/modules/admin/commissions";

export const metadata: Metadata = { title: "Commissions" };

export default function Page() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <CommissionsView />
    </Suspense>
  );
}
