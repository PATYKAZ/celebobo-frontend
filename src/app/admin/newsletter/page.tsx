import type { Metadata } from "next";
import { NewsletterView } from "@/modules/admin/newsletter/NewsletterView";

export const metadata: Metadata = { title: "Newsletter" };

export default function Page() {
  return <NewsletterView />;
}
