import type { ReactNode } from "react";
import { PageTransition } from "@/shared/animations/PageTransition";

/** Re-monté à chaque navigation => transition d'entrée de page. */
export default function ShopTemplate({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <div className="flex flex-col gap-4">{children}</div>
    </PageTransition>
  );
}
