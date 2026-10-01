import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterView } from "@/modules/auth/components/RegisterView";

export const metadata: Metadata = { title: "Inscription" };

export default function Page() {
  return (
    <Suspense>
      <RegisterView />
    </Suspense>
  );
}
