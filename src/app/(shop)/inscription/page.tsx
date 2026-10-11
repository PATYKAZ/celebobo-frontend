import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardSkeleton } from "@/shared/ui/PageSkeletons";
import { RegisterView } from "@/modules/auth/components/RegisterView";

export const metadata: Metadata = { title: "Inscription" };

export default function Page() {
  return (
    <Suspense fallback={<AuthCardSkeleton fields={5} />}>
      <RegisterView />
    </Suspense>
  );
}
