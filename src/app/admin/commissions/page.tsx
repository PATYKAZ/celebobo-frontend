import type { Metadata } from "next";
import { Suspense } from "react";
import { CommissionsView } from "@/modules/admin/commissions";

export const metadata: Metadata = { title: "Commissions" };

export default function Page() {
  return (
    <Suspense>
      <CommissionsView />
    </Suspense>
  );
}
