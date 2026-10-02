import type { Metadata } from "next";
import { AuditView } from "@/modules/admin/audit";

export const metadata: Metadata = { title: "Journal d'audit" };

export default function Page() {
  return <AuditView />;
}
