import type { Metadata } from "next";
import { Suspense } from "react";
import { NewClaimView } from "@/modules/claims";

export const metadata: Metadata = { title: "Faire une réclamation" };

export default function Page() {
  return (
    <Suspense>
      <NewClaimView />
    </Suspense>
  );
}
