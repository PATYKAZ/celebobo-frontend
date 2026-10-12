import type { Metadata } from "next";
import { LoyaltyView } from "@/modules/admin/loyalty/components/LoyaltyView";

export const metadata: Metadata = { title: "Programmes de fidélité" };

export default function Page() {
  return <LoyaltyView />;
}
