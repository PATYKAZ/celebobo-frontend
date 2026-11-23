import type { Metadata } from "next";
import { ExportsView } from "@/modules/admin/exports/ExportsView";

export const metadata: Metadata = { title: "Mes exports" };

export default function Page() {
  return <ExportsView />;
}
