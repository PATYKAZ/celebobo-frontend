import type { Metadata } from "next";
import { SearchResultsView } from "@/modules/search";

export const metadata: Metadata = { title: "Recherche" };

export default function Page() {
  return <SearchResultsView />;
}
