import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordView } from "@/modules/auth/components/ResetPasswordView";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordView />
    </Suspense>
  );
}
