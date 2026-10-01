import type { Metadata } from "next";
import { MessagesView } from "@/modules/messaging";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return <MessagesView />;
}
