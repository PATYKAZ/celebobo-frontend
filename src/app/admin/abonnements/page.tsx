import type { Metadata } from "next";
import { MembershipsView } from "@/modules/admin/memberships/components/MembershipsView";

export const metadata: Metadata = { title: "Abonnements Celebobo Plus" };

export default function Page() {
  return <MembershipsView />;
}
