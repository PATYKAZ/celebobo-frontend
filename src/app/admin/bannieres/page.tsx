import type { Metadata } from "next";
import { BannersView } from "@/modules/admin/banners";

export const metadata: Metadata = { title: "Bannières de l'accueil" };

export default function Page() {
  return <BannersView />;
}
