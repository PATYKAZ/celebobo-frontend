import type { Metadata } from "next";
import { DashboardView } from "@/modules/admin/dashboard";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function Page() {
  return <DashboardView />;
}
