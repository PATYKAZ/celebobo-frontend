import type { Metadata } from "next";
import { InvitesView } from "@/modules/admin/reseller-space";

export const metadata: Metadata = { title: "Mes invités" };

export default function Page() {
  return <InvitesView />;
}
