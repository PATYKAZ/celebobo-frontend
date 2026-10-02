import type { Metadata } from "next";
import { NotificationSettingsView } from "@/modules/account/components/NotificationSettingsView";

export const metadata: Metadata = { title: "Notifications & préférences" };

export default function Page() {
  return <NotificationSettingsView />;
}
