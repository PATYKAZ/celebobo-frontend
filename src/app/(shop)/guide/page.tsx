import type { Metadata } from "next";
import { GuideView } from "@/modules/guide";

export const metadata: Metadata = { title: "Guide d'achat" };

export default function Page() {
  return <GuideView />;
}
