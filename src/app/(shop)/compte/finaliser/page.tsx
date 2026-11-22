import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountCompletionView } from "@/modules/consents";

export const metadata: Metadata = { title: "Finaliser mon compte", robots: { index: false } };

export default function Page() {
  // useSearchParams (`next`) : Suspense pour ne pas forcer le rendu client de toute la route
  return (
    <Suspense fallback={null}>
      <AccountCompletionView />
    </Suspense>
  );
}
