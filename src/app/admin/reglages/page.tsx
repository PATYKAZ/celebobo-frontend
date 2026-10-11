import type { Metadata } from "next";
import { SettingsView } from "@/modules/admin/settings";

export const metadata: Metadata = { title: "Réglages du site" };

export default function Page() {
  return <SettingsView />;
}
