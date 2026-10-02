import type { Metadata } from "next";
import { CategoriesView } from "@/modules/admin/categories";

export const metadata: Metadata = { title: "Catégories" };

export default function Page() {
  return <CategoriesView />;
}
