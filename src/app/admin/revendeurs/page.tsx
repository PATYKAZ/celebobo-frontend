import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageSkeleton } from "@/modules/admin/ui/AdminSkeletons";
import { ResellersView } from "@/modules/admin/resellers";

export const metadata: Metadata = { title: "Revendeurs" };

export default function Page() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <ResellersView />
    </Suspense>
  );
}
