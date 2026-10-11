import type { Metadata } from "next";
import { Suspense } from "react";
import { FormPageSkeleton } from "@/shared/ui/PageSkeletons";
import { TrackingView } from "@/modules/tracking/components/TrackingView";

export const metadata: Metadata = { title: "Suivre ma commande" };

export default function Page() {
  return (
    <Suspense fallback={<FormPageSkeleton fields={2} />}>
      <TrackingView />
    </Suspense>
  );
}
