import type { ReactNode } from "react";
import { PageTransition } from "@/shared/animations/PageTransition";

export default function AdminTemplate({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <div className="flex flex-col gap-4">{children}</div>
    </PageTransition>
  );
}
