import type { ReactNode } from "react";
import { ShopShell } from "@/shared/layout/ShopShell";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <ShopShell>{children}</ShopShell>;
}
