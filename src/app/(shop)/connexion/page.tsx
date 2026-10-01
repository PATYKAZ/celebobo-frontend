import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/modules/auth/components/LoginView";

export const metadata: Metadata = { title: "Connexion" };

export default function Page() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
