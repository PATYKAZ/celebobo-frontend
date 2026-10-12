import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardSkeleton } from "@/shared/ui/PageSkeletons";
import { LoginView } from "@/modules/auth/components/LoginView";

export const metadata: Metadata = { title: "Connexion" };

export default function Page() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <LoginView />
    </Suspense>
  );
}
