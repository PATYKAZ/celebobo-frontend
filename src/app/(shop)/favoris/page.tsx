import type { Metadata } from "next";
import { FavoritesView } from "@/modules/favorites/components/FavoritesView";

export const metadata: Metadata = { title: "Mes favoris" };

export default function Page() {
  return <FavoritesView />;
}
