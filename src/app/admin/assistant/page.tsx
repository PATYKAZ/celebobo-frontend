import type { Metadata } from "next";
import { AssistantLogView } from "@/modules/admin/assistant/AssistantLogView";

export const metadata: Metadata = { title: "Assistant" };

export default function Page() {
  return <AssistantLogView />;
}
