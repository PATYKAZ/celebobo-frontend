import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleCallbackView } from "@/modules/auth/components/GoogleCallbackView";

export const metadata: Metadata = { title: "Connexion Google", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <GoogleCallbackView />
    </Suspense>
  );
}
