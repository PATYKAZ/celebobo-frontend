import type { Metadata } from "next";
import { Suspense } from "react";
import { FormPageSkeleton } from "@/shared/ui/PageSkeletons";
import { UnsubscribeView } from "@/modules/newsletter";

export const metadata: Metadata = { title: "Désinscription newsletter", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<FormPageSkeleton fields={1} />}>
      <UnsubscribeView />
    </Suspense>
  );
}
