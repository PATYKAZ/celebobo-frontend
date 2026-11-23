import type { Metadata } from "next";
import { ApplicationsView } from "@/modules/admin/applications/ApplicationsView";

export const metadata: Metadata = { title: "Candidatures revendeur" };

export default function Page() {
  return <ApplicationsView />;
}
