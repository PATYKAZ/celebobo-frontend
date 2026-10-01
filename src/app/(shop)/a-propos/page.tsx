import type { Metadata } from "next";
import { AboutView } from "@/modules/about";

export const metadata: Metadata = { title: "À propos" };

export default function Page() {
  return <AboutView />;
}
