import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackingView } from "@/modules/tracking/components/TrackingView";

export const metadata: Metadata = { title: "Suivre ma commande" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TrackingView />
    </Suspense>
  );
}
