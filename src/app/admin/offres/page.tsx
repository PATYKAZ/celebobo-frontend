import type { Metadata } from "next";
import { DealsView } from "@/modules/admin/deals";

export const metadata: Metadata = { title: "Offres du jour" };

export default function Page() {
  return <DealsView />;
}
