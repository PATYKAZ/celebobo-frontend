import type { Metadata } from "next";
import { MembershipView } from "@/modules/membership/components/MembershipView";

export const metadata: Metadata = { title: "Abonnement Celebobo Plus" };

export default function Page() {
  return <MembershipView />;
}
