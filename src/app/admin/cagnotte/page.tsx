import type { Metadata } from "next";
import { CagnotteView } from "@/modules/admin/cagnotte/CagnotteView";

export const metadata: Metadata = { title: "Cagnotte" };

export default function Page() {
  return <CagnotteView />;
}
