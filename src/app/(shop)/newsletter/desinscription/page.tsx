import type { Metadata } from "next";
import { Suspense } from "react";
import { UnsubscribeView } from "@/modules/newsletter";

export const metadata: Metadata = { title: "Désinscription newsletter", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <UnsubscribeView />
    </Suspense>
  );
}
