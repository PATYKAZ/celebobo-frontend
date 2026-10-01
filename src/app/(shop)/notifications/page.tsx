import type { Metadata } from "next";
import { NotificationsView } from "@/modules/messaging";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return <NotificationsView />;
}
