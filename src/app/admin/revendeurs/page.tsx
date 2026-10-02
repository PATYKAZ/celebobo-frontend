import type { Metadata } from "next";
import { Suspense } from "react";
import { ResellersView } from "@/modules/admin/resellers";

export const metadata: Metadata = { title: "Revendeurs" };

export default function Page() {
  return (
    <Suspense>
      <ResellersView />
    </Suspense>
  );
}
