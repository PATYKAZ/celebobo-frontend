import type { Metadata } from "next";
import { FaqView } from "@/modules/admin/faq/FaqView";

export const metadata: Metadata = { title: "FAQ" };

export default function Page() {
  return <FaqView />;
}
