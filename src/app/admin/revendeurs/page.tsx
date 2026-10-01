import type { Metadata } from "next";
import { ResellersView } from "@/modules/admin/resellers";

export const metadata: Metadata = { title: "Revendeurs" };

export default function Page() {
  return <ResellersView />;
}
