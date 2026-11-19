import type { Metadata } from "next";
import { PagesView } from "@/modules/admin/pages";

export const metadata: Metadata = { title: "Pages et politiques" };

export default function Page() {
  return <PagesView />;
}
