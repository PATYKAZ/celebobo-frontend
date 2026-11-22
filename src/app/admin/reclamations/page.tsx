import type { Metadata } from "next";
import { AdminClaimsView } from "@/modules/claims";

export const metadata: Metadata = { title: "Réclamations" };

export default function Page() {
  return <AdminClaimsView />;
}
