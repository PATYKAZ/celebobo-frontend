import type { Metadata } from "next";
import { AdminHome } from "@/modules/admin/home/AdminHome";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function Page() {
  return <AdminHome />;
}
