import type { Metadata } from "next";
import { AssistantView } from "@/modules/assistant";

export const metadata: Metadata = { title: "Assistant Celebobo" };

export default function Page() {
  return <AssistantView />;
}
