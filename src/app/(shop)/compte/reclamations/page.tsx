import type { Metadata } from "next";
import { MyClaimsView } from "@/modules/claims";

export const metadata: Metadata = { title: "Mes réclamations" };

export default function Page() {
  return <MyClaimsView />;
}
