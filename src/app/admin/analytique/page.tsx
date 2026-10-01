import type { Metadata } from "next";
import { AnalyticsView } from "@/modules/admin/analytics";

export const metadata: Metadata = { title: "Analytique" };

export default function Page() {
  return <AnalyticsView />;
}
