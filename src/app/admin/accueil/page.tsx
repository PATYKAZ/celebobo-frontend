import type { Metadata } from "next";
import { HomeSectionsView } from "@/modules/admin/home-sections";

export const metadata: Metadata = { title: "Blocs de l'accueil" };

export default function Page() {
  return <HomeSectionsView />;
}
