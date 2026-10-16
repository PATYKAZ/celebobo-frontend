import { Metadata } from "next";
import { MembershipView } from "@/modules/membership/components/MembershipView";

export const metadata: Metadata = { title: "Mes points fidélité" };

export default function Page() {
  return <MembershipView />;
}
